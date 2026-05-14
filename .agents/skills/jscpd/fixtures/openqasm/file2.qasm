// OpenQASM 3.0 - Grover's Search Algorithm
OPENQASM 3.0;
include "stdgates.inc";

// Oracle that marks |11> state on 2 qubits
gate oracle q0, q1 {
  cz q0, q1;
}

// Diffusion operator (inversion about average)
gate diffusion q0, q1 {
  h q0;
  h q1;
  x q0;
  x q1;
  cz q0, q1;
  x q0;
  x q1;
  h q0;
  h q1;
}

// Quantum Fourier Transform on n qubits
gate qft_2 q0, q1 {
  h q0;
  ctrl @ p(pi/2) q1, q0;
  h q1;
  swap q0, q1;
}

gate qft_3 q0, q1, q2 {
  h q0;
  ctrl @ p(pi/2) q1, q0;
  ctrl @ p(pi/4) q2, q0;
  h q1;
  ctrl @ p(pi/2) q2, q1;
  h q2;
  swap q0, q2;
}

qubit[2] q;
bit[2] c;

// Initialize superposition
h q[0];
h q[1];

// One Grover iteration
oracle q[0], q[1];
diffusion q[0], q[1];

// Measure
c = measure q;
