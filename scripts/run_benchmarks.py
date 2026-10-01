"""Executable script to run Q-GREEN FLEET scientific benchmarks."""

import sys
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root not in sys.path:
    sys.path.insert(0, root)

from backend.app.benchmark.runner import BenchmarkSuite


def main():
    print("===============================================================")
    print(" Q-GREEN FLEET: Running Multi-Objective Maritime Benchmarks   ")
    print("===============================================================")
    suite = BenchmarkSuite(eval_budget=50, seed=42)
    report_file = suite.run_all_and_save()
    print(f"\nBenchmarks completed successfully! Report generated at:\n{report_file}")


if __name__ == "__main__":
    main()
