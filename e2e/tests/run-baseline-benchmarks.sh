cd ../data

run_benchmark() {
	OUT_DIR=../../benchmarks/$2/cli/
	mkdir -p $OUT_DIR

	/usr/bin/time -v viral_consensus -i "../data/reads_$1.sam" -r NC_045512.fas -o "$OUT_DIR/consensus.fa" -q 20 -d 10 -f 0.5 -a N 2>time_output.log

	grep "User time (seconds): " time_output.log | awk '{print $4}' >"$OUT_DIR/time.log"
	grep "Maximum resident set size (kbytes): " time_output.log | awk '{print $6}' >"$OUT_DIR/memory.log"

}

for r in {1..10}; do
	for i in 1000 10000 100000 1000000; do
		run_benchmark $i "$i.$r"
	done
done
