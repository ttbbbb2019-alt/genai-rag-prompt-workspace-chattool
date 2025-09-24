export const useSpeechRecognition = () => ({
  transcript: '',
  listening: false,
  resetTranscript: jest.fn(),
  browserSupportsSpeechRecognition: true,
});

const SpeechRecognition = {
  startListening: jest.fn(),
  stopListening: jest.fn(),
  abortListening: jest.fn(),
};

export default SpeechRecognition;
