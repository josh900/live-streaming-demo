class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.isRecording = false;
    }
  
    process(inputs, outputs, parameters) {
      if (!this.isRecording) return true;
  
      const input = inputs[0];
      const output = outputs[0];
  
      for (let channel = 0; channel < input.length; ++channel) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        for (let i = 0; i < inputChannel.length; ++i) {
          outputChannel[i] = inputChannel[i];
        }
      }
  
      this.port.postMessage(input[0]);
  
      return true;
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);