class DeepgramProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.bufferSize = 1024;
      this.buffer = new Float32Array(this.bufferSize);
      this.bufferIndex = 0;
    }
  
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const channel = input[0];
  
      for (let i = 0; i < channel.length; i++) {
        this.buffer[this.bufferIndex] = channel[i];
        this.bufferIndex++;
  
        if (this.bufferIndex === this.bufferSize) {
          const int16Buffer = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            int16Buffer[j] = Math.max(-1, Math.min(1, this.buffer[j])) * 0x7FFF;
          }
          this.port.postMessage(int16Buffer.buffer, [int16Buffer.buffer]);
          this.bufferIndex = 0;
        }
      }
  
      return true;
    }
  }
  
  registerProcessor('deepgram-processor', DeepgramProcessor);