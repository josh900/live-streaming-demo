class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 4096;
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const channel = input[0];

        if (channel.length > 0) {
            for (let i = 0; i < channel.length; i++) {
                this.buffer[this.bufferIndex] = channel[i];
                this.bufferIndex++;

                if (this.bufferIndex === this.bufferSize) {
                    this.sendAudioData();
                    this.bufferIndex = 0;
                }
            }
        }

        return true;
    }

    sendAudioData() {
        const audioData = this.convertFloat32ToInt16(this.buffer);
        this.port.postMessage(audioData.buffer, [audioData.buffer]);
    }

    convertFloat32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }
}

registerProcessor('audio-processor', AudioProcessor);