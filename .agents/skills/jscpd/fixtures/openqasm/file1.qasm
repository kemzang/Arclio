// OpenQASM 3.0 - Quantum Fourier Transform
OPENQASM 3.0;
include "stdgates.inc";

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

qubit[3] q;
bit[3] c;

// Initialize to |110> state
x q[0];
x q[1];

// Apply 3-qubit QFT
qft_3 q[0], q[1], q[2];

// Measure
c = measure q;
