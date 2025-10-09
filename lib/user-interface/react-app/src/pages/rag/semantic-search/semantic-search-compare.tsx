import {
  Button,
  Container,
  Form,
  FormField,
  Header,
  SpaceBetween,
  Textarea,
  Alert,
  Tabs,
  TabsProps,
  Box,
  ExpandableSection,
} from "@cloudscape-design/components";
import { useContext, useState } from "react";
import { AppContext } from "../../../common/app-context";
import { ApiClient } from "../../../common/api-client/api-client";
import { SemanticSearchCompareResult, SemanticSearchPromptResult } from "../../../API";
import ResultItems from "./result-items";
import SemanticSearchDetails from "./semantic-search-details";

interface SemanticSearchCompareProps {
  workspaceId: string;
}

export default function SemanticSearchCompare({ workspaceId }: SemanticSearchCompareProps) {
  const appContext = useContext(AppContext);
  const [prompts, setPrompts] = useState<string[]>(["", ""]);
  const [compareResult, setCompareResult] = useState<SemanticSearchCompareResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | undefined>(undefined);

  const addPrompt = () => {
    if (prompts.length < 10) {
      setPrompts([...prompts, ""]);
    }
  };

  const removePrompt = (index: number) => {
    if (prompts.length > 2) {
      const newPrompts = prompts.filter((_, i) => i !== index);
      setPrompts(newPrompts);
    }
  };

  const updatePrompt = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  const handleSubmit = async () => {
    if (!workspaceId) {
      setGlobalError("Please select a workspace");
      return;
    }

    if (!appContext) {
      setGlobalError("Application context not available");
      return;
    }

    const validPrompts = prompts.filter(p => p.trim().length > 0);
    if (validPrompts.length < 2) {
      setGlobalError("Please enter at least 2 prompts to compare");
      return;
    }

    setSubmitting(true);
    setGlobalError(undefined);

    try {
      const apiClient = new ApiClient(appContext);
      const result = await apiClient.semanticSearch.compare({
        workspaceId,
        prompts: validPrompts,
        limit: 25,
      });

      setCompareResult(result.data?.performSemanticSearchCompare || null);
    } catch (error: any) {
      console.error("Error performing semantic search comparison:", error);
      setGlobalError(error.errors?.map((x: any) => x.message).join(",") || "An error occurred while comparing prompts");
    } finally {
      setSubmitting(false);
    }
  };

  const renderPromptResult = (promptResult: SemanticSearchPromptResult, index: number) => {
    if (promptResult.error) {
      return (
        <Alert type="error" header={`Prompt ${index + 1} Error`}>
          {promptResult.error}
        </Alert>
      );
    }

    if (!promptResult.result) {
      return (
        <Alert type="warning" header={`Prompt ${index + 1}`}>
          No results available
        </Alert>
      );
    }

    const tabs: TabsProps.Tab[] = [
      {
        id: "items",
        label: `Results (${promptResult.result.items?.length || 0})`,
        content: (
          <ResultItems
            items={promptResult.result.items || []}
            result={promptResult.result}
          />
        ),
      },
      {
        id: "details",
        label: "Details",
        content: (
          <SemanticSearchDetails 
            searchResults={promptResult.result}
            detailsExpanded={true}
            setDetailsExpanded={() => {}}
          />
        ),
      },
    ];

    return (
      <ExpandableSection
        headerText={`Prompt ${index + 1}: "${promptResult.prompt.substring(0, 50)}${promptResult.prompt.length > 50 ? '...' : ''}"`}
        defaultExpanded={index === 0}
      >
        <Tabs tabs={tabs} />
      </ExpandableSection>
    );
  };

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h2">Compare Multiple Prompts</Header>}>
        <Form
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="normal"
                onClick={addPrompt}
                disabled={prompts.length >= 10}
              >
                Add Prompt
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={prompts.filter(p => p.trim().length > 0).length < 2 || !workspaceId}
              >
                Compare Prompts
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="l">
            {globalError && (
              <Alert type="error" dismissible onDismiss={() => setGlobalError(undefined)}>
                {globalError}
              </Alert>
            )}

            {!workspaceId && (
              <Alert type="warning">
                Please select a workspace in the Single Search tab first.
              </Alert>
            )}

            {prompts.map((prompt, index) => (
              <FormField
                key={index}
                label={`Prompt ${index + 1}`}
                description={`Enter your search query (max 256 characters)`}
                secondaryControl={
                  prompts.length > 2 && (
                    <Button
                      variant="icon"
                      iconName="close"
                      onClick={() => removePrompt(index)}
                    />
                  )
                }
              >
                <Textarea
                  value={prompt}
                  onChange={({ detail }) => updatePrompt(index, detail.value)}
                  placeholder={`Enter prompt ${index + 1}...`}
                  rows={3}
                />
              </FormField>
            ))}

            <Box textAlign="center" color="text-body-secondary">
              <small>
                You can compare up to 10 prompts. At least 2 prompts are required.
              </small>
            </Box>
          </SpaceBetween>
        </Form>
      </Container>

      {compareResult && (
        <Container
          header={
            <Header
              variant="h2"
              description={`Comparing ${compareResult.totalPrompts} prompts using ${compareResult.engine} engine`}
            >
              Comparison Results
            </Header>
          }
        >
          <SpaceBetween size="l">
            {compareResult.promptsComparison?.map((promptResult, index) =>
              renderPromptResult(promptResult, index)
            )}
          </SpaceBetween>
        </Container>
      )}
    </SpaceBetween>
  );
}
