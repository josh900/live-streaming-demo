class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
  
      if (input && input.length > 0) {
        // Pass the audio data to the main thread
        this.port.postMessage(input[0]);
      }
  
      // If you want to output audio (which we don't in this case), uncomment these lines:
      // for (let channel = 0; channel < output.length; ++channel) {
      //   output[channel].set(input[channel]);
      // }
  
      return true;
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);
  