class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const inputData = input[0];
      this.port.postMessage(inputData, [inputData.buffer]);
    }
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);