// Q# - Bernstein-Vazirani Algorithm
namespace BernsteinVazirani {
    open Microsoft.Quantum.Canon;
    open Microsoft.Quantum.Intrinsic;
    open Microsoft.Quantum.Measurement;

    // Prepare a Bell pair between two qubits
    operation CreateBellPair(q1 : Qubit, q2 : Qubit) : Unit {
        H(q1);
        CNOT(q1, q2);
    }

    // Oracle encoding secret string s = "101"
    operation BVOracle(queryReg : Qubit[], target : Qubit) : Unit {
        // s = 101 => apply CNOT for bits 0 and 2
        CNOT(queryReg[0], target);
        CNOT(queryReg[2], target);
    }

    // Bernstein-Vazirani algorithm to find hidden string
    operation FindHiddenString(n : Int) : Result[] {
        use queryReg = Qubit[n];
        use target   = Qubit();

        // Prepare target in |-> state
        X(target);
        H(target);

        // Apply Hadamard to all query qubits
        ApplyToEach(H, queryReg);

        // Apply oracle
        BVOracle(queryReg, target);

        // Apply Hadamard again to query register
        ApplyToEach(H, queryReg);

        // Measure query register
        let results = MultiM(queryReg);
        Message($"Hidden string: {results}");

        Reset(target);
        return results;
    }

    @EntryPoint()
    operation BVDemo() : Result[] {
        return FindHiddenString(3);
    }
}
