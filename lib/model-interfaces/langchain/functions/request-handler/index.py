import os
import json
import uuid
from datetime import datetime
from genai_core.registry import registry
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities import parameters
from aws_lambda_powertools.utilities.batch import BatchProcessor, EventType
from aws_lambda_powertools.utilities.batch.exceptions import BatchProcessingError
from aws_lambda_powertools.utilities.data_classes.sqs_event import SQSRecord
from aws_lambda_powertools.utilities.typing import LambdaContext

import adapters  # noqa: F401 Needed to register the adapters
from genai_core.utils.websocket import send_to_client
from genai_core.types import ChatbotAction

# LangSmith integration
from langsmith_config import langsmith_enabled

processor = BatchProcessor(event_type=EventType.SQS)
tracer = Tracer()
logger = Logger()

AWS_REGION = os.environ["AWS_REGION"]
API_KEYS_SECRETS_ARN = os.environ["API_KEYS_SECRETS_ARN"]

sequence_number = 0


def on_llm_new_token(
    user_id, session_id, self, token, run_id, chunk, parent_run_id, *args, **kwargs
):
    if self.disable_streaming:
        logger.debug("Streaming is disabled, ignoring token")
        return
    if isinstance(token, list):
        # When using the newer Chat objects from Langchain.
        # Token is not a string
        text = ""
        for t in token:
            if "text" in t:
                text = text + t.get("text")
    else:
        text = token
    if text is None or len(text) == 0:
        return
    global sequence_number
    sequence_number += 1
    run_id = str(run_id)

    send_to_client(
        {
            "type": "text",
            "action": ChatbotAction.LLM_NEW_TOKEN.value,
            "userId": user_id,
            "timestamp": str(int(round(datetime.now().timestamp()))),
            "data": {
                "sessionId": session_id,
                "token": {
                    "runId": run_id,
                    "sequenceNumber": sequence_number,
                    "value": text,
                },
            },
        }
    )


def handle_heartbeat(record):
    user_id = record["userId"]
    session_id = record["data"]["sessionId"]

    send_to_client(
        {
            "type": "text",
            "action": ChatbotAction.HEARTBEAT.value,
            "timestamp": str(int(round(datetime.now().timestamp()))),
            "userId": user_id,
            "data": {
                "sessionId": session_id,
            },
        }
    )


def handle_compare(record):
    user_id = record["userId"]
    user_groups = record["userGroups"]
    data = record["data"]
    session_id = data.get("sessionId")
    workspace_id = data.get("workspaceId")
    prompts = data.get("prompts", [])
    system_prompts = record.get("systemPrompts", {})
    
    # Get model info from first session (assuming all use same model for comparison)
    # In production, this could be passed in the request
    provider = "anthropic"  # Default, should be configurable
    model_id = "claude-3-haiku-20240307"  # Default, should be configurable
    mode = "chain"
    
    try:
        # Send initial response
        send_to_client(
            connection_id=session_id,
            message=json.dumps({
                "type": "text",
                "action": ChatbotAction.LLM_NEW_TOKEN.value,
                "timestamp": str(int(round(datetime.now().timestamp()))),
                "userId": user_id,
                "data": {
                    "sessionId": session_id,
                    "type": "text",
                    "content": f"Comparing {len(prompts)} prompts using workspace {workspace_id}...\n\n",
                    "metadata": {}
                }
            }),
            user_id=user_id,
        )
        
        # Get model adapter (same as handle_run)
        adapter = registry.get_adapter(f"{provider}.{model_id}")
        
        comparison_results = []
        
        # Process each prompt with real model
        for i, prompt in enumerate(prompts):
            try:
                # Create model instance for each prompt
                model = adapter(
                    model_id=model_id,
                    mode=mode,
                    session_id=f"{session_id}_prompt_{i}",
                    user_id=user_id,
                    model_kwargs={"temperature": 0.1, "maxTokens": 512},
                )
                
                # Call real model (same as handle_run)
                response = model.run(
                    prompt=prompt,
                    workspace_id=workspace_id,
                    user_groups=user_groups,
                    images=[],
                    documents=[],
                    videos=[],
                    system_prompts=system_prompts,
                )
                
                comparison_results.append({
                    "prompt": prompt,
                    "response": response.get("content", "No response"),
                    "metadata": response.get("metadata", {}),
                    "index": i
                })
                
                # Send intermediate progress
                send_to_client(
                    connection_id=session_id,
                    message=json.dumps({
                        "type": "text",
                        "action": ChatbotAction.LLM_NEW_TOKEN.value,
                        "timestamp": str(int(round(datetime.now().timestamp()))),
                        "userId": user_id,
                        "data": {
                            "sessionId": session_id,
                            "type": "text",
                            "content": f"Completed prompt {i+1}/{len(prompts)}\n",
                            "metadata": {}
                        }
                    }),
                    user_id=user_id,
                )
                
            except Exception as e:
                logger.exception(f"Error processing prompt {i}")
                comparison_results.append({
                    "prompt": prompt,
                    "response": f"Error: {str(e)}",
                    "metadata": {},
                    "index": i
                })
        
        # Send final comparison results
        final_response = {
            "type": "text",
            "action": ChatbotAction.FINAL_RESPONSE.value,
            "timestamp": str(int(round(datetime.now().timestamp()))),
            "userId": user_id,
            "data": {
                "sessionId": session_id,
                "type": "text",
                "content": format_comparison_results(comparison_results),
                "metadata": {"compareResults": comparison_results, "workspaceId": workspace_id}
            }
        }
        
        send_to_client(
            connection_id=session_id,
            message=json.dumps(final_response),
            user_id=user_id,
        )
        
    except Exception as e:
        logger.exception("Compare error")
        error_response = {
            "type": "text", 
            "action": "error",
            "userId": user_id,
            "data": {
                "sessionId": session_id,
                "content": f"Compare failed: {str(e)}"
            }
        }
        send_to_client(
            connection_id=session_id,
            message=json.dumps(error_response),
            user_id=user_id,
        )

def format_comparison_results(results):
    workspace_id = results[0].get('metadata', {}).get('workspaceId', 'unknown') if results else 'unknown'
    content = f"## Prompt Comparison Results (Workspace: {workspace_id})\n\n"
    
    for result in results:
        i = result['index']
        content += f"### Prompt {i+1}\n"
        content += f"**Input:** {result['prompt']}\n\n"
        content += f"**Response:** {result['response']}\n\n"
        
        # Add metadata if available
        if result.get('metadata'):
            metadata = result['metadata']
            if metadata.get('usage'):
                usage = metadata['usage']
                content += f"**Usage:** {usage.get('input_tokens', 0)} input tokens, {usage.get('output_tokens', 0)} output tokens\n\n"
        
        content += "---\n\n"
    
    return content


def handle_run(record):
    user_id = record["userId"]
    user_groups = record["userGroups"]
    data = record["data"]
    provider = data["provider"]
    model_id = data["modelName"]
    mode = data["mode"]
    prompt = data["text"]
    workspace_id = data.get("workspaceId", None)
    session_id = data.get("sessionId")
    images = data.get("images", [])
    documents = data.get("documents", [])
    videos = data.get("videos", [])
    system_prompts = record.get("systemPrompts", {})
    if not session_id:
        session_id = str(uuid.uuid4())

    # LangSmith: Add metadata for tracing
    if langsmith_enabled:
        os.environ["LANGCHAIN_SESSION_ID"] = session_id
        os.environ["LANGCHAIN_USER_ID"] = user_id

    adapter = registry.get_adapter(f"{provider}.{model_id}")

    adapter.on_llm_new_token = lambda *args, **kwargs: on_llm_new_token(
        user_id, session_id, *args, **kwargs
    )

    model = adapter(
        model_id=model_id,
        mode=mode,
        session_id=session_id,
        user_id=user_id,
        model_kwargs=data.get("modelKwargs", {}),
    )

    response = model.run(
        prompt=prompt,
        workspace_id=workspace_id,
        user_groups=user_groups,
        images=images,
        documents=documents,
        videos=videos,
        system_prompts=system_prompts,
    )

    logger.debug(response)

    send_to_client(
        {
            "type": "text",
            "action": ChatbotAction.FINAL_RESPONSE.value,
            "timestamp": str(int(round(datetime.now().timestamp()))),
            "userId": user_id,
            "userGroups": user_groups,
            "data": response,
        }
    )


@tracer.capture_method
def record_handler(record: SQSRecord):
    payload: str = record.body
    message: dict = json.loads(payload)
    detail: dict = json.loads(message["Message"])
    logger.debug(detail)
    logger.info("details", detail=detail)

    if detail["action"] == ChatbotAction.RUN.value:
        handle_run(detail)
    elif detail["action"] == ChatbotAction.COMPARE.value:
        handle_compare(detail)
    elif detail["action"] == ChatbotAction.HEARTBEAT.value:
        handle_heartbeat(detail)


def handle_failed_records(records):
    for triplet in records:
        status, error, record = triplet
        payload: str = record.body
        message: dict = json.loads(payload)
        detail: dict = json.loads(message["Message"])
        user_id = detail["userId"]
        data = detail.get("data", {})
        session_id = data.get("sessionId", "")

        message = "⚠️ *Something went wrong*"
        if (
            "An error occurred (ValidationException)" in error
            and "The provided image must have dimensions in set [1280x720]" in error
        ):
            # At this time only one input size is supported by the Nova reel model.
            message = "⚠️ *The provided image must have dimensions of 1280x720.*"
        elif (
            "An error occurred (ValidationException)" in error
            and "The width of the provided image must be within range [320, 4096]"
            in error
        ):
            # At this time only this size is supported by the Nova canvas model.
            message = "⚠️ *The width of the provided image must be within range 320 and 4096 pixels.*"  # noqa
        elif (
            "An error occurred (AccessDeniedException)" in error
            and "You don't have access to the model with the specified model ID"
            in error
        ):
            message = (
                "*This model is not enabled. "
                "Please try again later or contact "
                "an administrator*"
            )
        else:
            logger.error("Unable to process request", error=error)

        send_to_client(
            {
                "type": "text",
                "action": "error",
                "direction": "OUT",
                "userId": user_id,
                "timestamp": str(int(round(datetime.now().timestamp()))),
                "data": {
                    "sessionId": session_id,
                    # Log a vague message because the error can contain
                    # internal information
                    "content": message,
                    "type": "text",
                },
            }
        )


@logger.inject_lambda_context(log_event=False)
@tracer.capture_lambda_handler
def handler(event, context: LambdaContext):
    batch = event["Records"]

    api_keys = parameters.get_secret(API_KEYS_SECRETS_ARN, transform="json")
    for key in api_keys:
        os.environ[key] = api_keys[key]

    try:
        with processor(records=batch, handler=record_handler):
            processed_messages = processor.process()
    except BatchProcessingError as e:
        logger.error(e)

    for message in processed_messages:
        logger.info(
            "Request compelte with status " + message[0],
            status=message[0],
            cause=message[1],
        )
    handle_failed_records(
        message for message in processed_messages if message[0] == "fail"
    )

    return processor.response()
