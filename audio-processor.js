class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      if (input && input.length > 0) {
        // Convert the Float32Array to Int16Array
        const inputData = input[0];
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16Data[i] = Math.max(-32768, Math.min(32767, Math.floor(inputData[i] * 32768)));
        }
        this.port.postMessage(int16Data.buffer);
      }
      return true;
    }
  }
  
  registerProcessor('audio-processor', AudioProcessor);