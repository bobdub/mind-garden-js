export class Neuron {
  weights: number[];
  bias: number;

  constructor(weights: number[] = [], bias: number = 0) {
    this.weights = weights.length > 0 ? weights : Array(10).fill(0).map(() => Math.random() * 2 - 1);
    this.bias = bias;
  }

  activate(inputs: number[]): number {
    const sum = inputs.reduce((acc, input, i) => acc + input * this.weights[i], this.bias);
    return this.sigmoid(sum);
  }

  sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  adjust(inputs: number[], error: number, learningRate: number = 0.1): void {
    this.weights = this.weights.map((w, i) => w + learningRate * error * inputs[i]);
    this.bias += learningRate * error;
  }
}
