// Voice Service (Browser-only for now)
export class VoiceService {
  private recognition: any;
  private isListening: boolean = false;
  private onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (this.onResultCallback) {
            if (finalTranscript) this.onResultCallback(finalTranscript, true);
            if (interimTranscript) this.onResultCallback(interimTranscript, false);
          }
        };

        this.recognition.onerror = (event: any) => {
          if (this.onErrorCallback) this.onErrorCallback(event.error);
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
        };
      }
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  start(onResult: (text: string, isFinal: boolean) => void, onError: (error: string) => void) {
    if (!this.recognition) return;
    if (this.isListening) return;

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    
    try {
        this.recognition.start();
        this.isListening = true;
    } catch (e) {
        console.error("Failed to start speech recognition", e);
    }
  }

  stop() {
    if (!this.recognition) return;
    this.recognition.stop();
    this.isListening = false;
  }
}

export const voiceService = new VoiceService();
