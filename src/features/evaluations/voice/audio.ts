export function decodeBase64ToInt16(base64: string) {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Int16Array(bytes.buffer)
}

export function encodeInt16ToBase64(values: Int16Array) {
  const bytes = new Uint8Array(values.buffer)
  let binary = ''

  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }

  return window.btoa(binary)
}

export function pcm16ToFloat32(values: Int16Array) {
  const floats = new Float32Array(values.length)

  for (let index = 0; index < values.length; index += 1) {
    floats[index] = Math.max(-1, Math.min(1, values[index] / 32768))
  }

  return floats
}

export function float32ToInt16(values: Float32Array) {
  const ints = new Int16Array(values.length)

  for (let index = 0; index < values.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, values[index]))
    ints[index] = sample < 0 ? sample * 32768 : sample * 32767
  }

  return ints
}

export function downsampleTo16k(input: Float32Array, inputSampleRate: number) {
  if (inputSampleRate === 16000) return input

  const ratio = inputSampleRate / 16000
  const outputLength = Math.round(input.length / ratio)
  const output = new Float32Array(outputLength)

  let outputIndex = 0
  let inputIndex = 0

  while (outputIndex < output.length) {
    const nextInputIndex = Math.round((outputIndex + 1) * ratio)
    let total = 0
    let count = 0

    for (
      let cursor = inputIndex;
      cursor < nextInputIndex && cursor < input.length;
      cursor += 1
    ) {
      total += input[cursor]
      count += 1
    }

    output[outputIndex] = count > 0 ? total / count : 0
    outputIndex += 1
    inputIndex = nextInputIndex
  }

  return output
}
