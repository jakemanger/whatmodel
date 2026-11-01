"""Verify the selected GEO Citation extract from a local copy of the pinned dataset.

Usage: python3 verify-geo-citation-2026-11-01.py /path/to/geo-citation-benchmark
Dataset: https://huggingface.co/datasets/citead/geo-citation-benchmark
Revision: cd2abf6868e15902735c35435410354f20df070d
Only the six files listed in the extract's inputs_sha256 are required.
This recomputes a statistic from released predictions; it does not run any model.
"""
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path
from statistics import mean
import sys


def average_ranks(values):
    # Zero-based ranks; the additive offset does not affect correlation.
    return [sum(other < value for other in values)
            + (sum(other == value for other in values) - 1) / 2
            for value in values]


def correlation(left, right):
    a, b = average_ranks(left), average_ranks(right)
    a = [x - mean(a) for x in a]
    b = [x - mean(b) for x in b]
    denominator = math.sqrt(sum(x*x for x in a) * sum(y*y for y in b))
    return sum(x*y for x, y in zip(a, b)) / denominator if denominator else 0.0


def verify(dataset):
    extract = json.loads((Path(__file__).resolve().parents[2]
                          / 'data/extracts/geo-citation-bysa.json').read_text())
    for relative, expected in extract['inputs_sha256'].items():
        actual = hashlib.sha256((dataset / relative).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f'Input differs from reviewed bytes: {relative}')
    groups = defaultdict(dict)
    for line in (dataset / 'benchmark/citation_labels.jsonl').read_text().splitlines():
        row = json.loads(line)
        groups[(row['engine'], row['query'])][row['src_idx']] = row['label_pawc']
    for result in extract['results']:
        relative = 'benchmark/' + result['source'].split('/benchmark/', 1)[1]
        predictions = json.loads((dataset / relative).read_text())
        scores = []
        for (_, query), labels in groups.items():
            if len(set(labels.values())) == 1:
                continue
            assert len(labels) == 5
            indices = sorted(labels)
            # Missing predictions are an error, never silently assigned zero.
            predicted = [predictions[f'{query}||{index}'] for index in indices]
            assert all(math.isfinite(x) for x in predicted)
            scores.append(correlation([labels[index] for index in indices], predicted))
        observed = mean(scores)
        assert len(scores) == 1220, (result['model'], len(scores))
        assert math.isclose(observed, result['score'], rel_tol=0, abs_tol=1e-12)
        print(f"{result['model']}: {len(scores)} groups, rho={observed:.9f}; verified")


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    verify(Path(sys.argv[1]))
