import { Neuron } from './Neuron';

export class Layer {
  neurons: Neuron[];

  constructor(size: number, inputSize: number) {
    this.neurons = Array(size).fill(null).map(() => new Neuron(
      Array(inputSize).fill(0).map(() => Math.random() * 2 - 1),
      Math.random() * 2 - 1
    ));
  }

  forward(inputs: number[]): number[] {
    return this.neurons.map(neuron => neuron.activate(inputs));
  }

  train(inputs: number[], errors: number[], learningRate: number): number[] {
    const inputErrors = Array(inputs.length).fill(0);
    
    this.neurons.forEach((neuron, i) => {
      neuron.adjust(inputs, errors[i], learningRate);
      neuron.weights.forEach((weight, j) => {
        inputErrors[j] += errors[i] * weight;
      });
    });

    return inputErrors;
  }
}
