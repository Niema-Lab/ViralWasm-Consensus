TEST_COUNT=5

cd ../data

run_benchmark() {
	OUT_DIR=../../benchmarks/$2/cli/
	mkdir -p $OUT_DIR

	total_time_taken=0
	peak_memory=0

	/usr/bin/time -v minimap2 -t 1 -a -o reads_$i.sam NC_045512.fas reads_$i.fastq.gz 2>minimap2_output.log
	minimap2_time_taken=$(grep "User time (seconds): " minimap2_output.log | awk '{print $4}')
	total_time_taken=$(echo "$total_time_taken + $minimap2_time_taken" | bc)
	memory=$(grep "Maximum resident set size (kbytes): " minimap2_output.log | awk '{print $6}')
	if [ $memory -gt $peak_memory ]; then
		peak_memory=$memory
	fi

	/usr/bin/time -v viral_consensus -i "../data/reads_$1.sam" -r NC_045512.fas -o "$OUT_DIR/consensus.fa" -q 20 -d 10 -f 0.5 -a N 2>viralconsensus_output.log
	viralconsensus_time_taken=$(grep "User time (seconds): " viralconsensus_output.log | awk '{print $4}')
	total_time_taken=$(echo "$total_time_taken + $viralconsensus_time_taken" | bc)
	memory=$(grep "Maximum resident set size (kbytes): " viralconsensus_output.log | awk '{print $6}')
	if [ $memory -gt $peak_memory ]; then
		peak_memory=$memory
	fi

	echo $minimap2_time_taken > "$OUT_DIR/minimap2_time.log"
	echo $viralconsensus_time_taken > "$OUT_DIR/viralconsensus_time.log"
	echo $total_time_taken > "$OUT_DIR/time.log"
	echo $peak_memory > "$OUT_DIR/memory.log"

	rm -rf reads_$i.sam
	rm -rf minimap2_output.log
	rm -rf viralconsensus_output.log
}

for r in $(seq 1 $TEST_COUNT); do
	for i in 1000 10000 100000 1000000; do
		run_benchmark $i "$i.$r"
	done
done
