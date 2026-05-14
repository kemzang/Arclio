// Q# - Quantum Teleportation Protocol
namespace QuantumTeleportation {
    open Microsoft.Quantum.Canon;
    open Microsoft.Quantum.Intrinsic;
    open Microsoft.Quantum.Measurement;

    // Prepare a Bell pair between two qubits
    operation CreateBellPair(q1 : Qubit, q2 : Qubit) : Unit {
        H(q1);
        CNOT(q1, q2);
    }

    // Teleport a qubit state from sender to receiver
    operation Teleport(msg : Qubit, here : Qubit, there : Qubit) : Unit {
        // Create Bell pair
        CreateBellPair(here, there);

        // Bell measurement
        CNOT(msg, here);
        H(msg);

        // Measure sender's qubits
        let m1 = M(msg);
        let m2 = M(here);

        // Apply corrections based on measurement results
        if m2 == One {
            X(there);
        }
        if m1 == One {
            Z(there);
        }
    }

    // Main entry point: teleport |+> state
    @EntryPoint()
    operation TeleportationDemo() : Result[] {
        use msg   = Qubit();
        use here  = Qubit();
        use there = Qubit();

        // Prepare message qubit in |+> state
        H(msg);

        Teleport(msg, here, there);

        // Measure the received qubit
        let result = M(there);
        Message($"Received: {result}");
        return [result];
    }
}
