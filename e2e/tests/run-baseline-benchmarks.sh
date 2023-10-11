TEST_COUNT=1

cd ../data

run_benchmark() {
	LOG_DIR=../../benchmarks/$2/cli/
	OUT_DIR=../../benchmark-run-outputs/$2/cli/
	mkdir -p $OUT_DIR
	mkdir -p $LOG_DIR

	total_time_taken=0
	peak_memory=0

	# $1: tool
	update_stats() {
		time_taken=$(grep "User time (seconds): " ${1}_output.log | awk '{print $4}')
		total_time_taken=$(echo "$time_taken + $total_time_taken" | bc)
		memory=$(grep "Maximum resident set size (kbytes): " ${1}_output.log | awk '{print $6}')
		echo $1
		echo $memory
		cat ${1}_output.log
		if [ "$memory" -gt "$peak_memory" ]; then
			peak_memory=$memory
		fi
		echo $time_taken >"$LOG_DIR/${1}_time.log"
	}

	/usr/bin/time -v fastp -i reads_$i.fastq.gz -o $OUT_DIR/reads_$i.fastp.fastq.gz --json /dev/null --html /dev/null --compression 9 --trim_front1 5 --trim_tail1 5 2>fastp_output.log
	update_stats fastp

	/usr/bin/time -v minimap2 -t 1 -a -o reads_$i.sam NC_045512.fas $OUT_DIR/reads_$i.fastp.fastq.gz 2>minimap2_output.log
	update_stats minimap2

	/usr/bin/time -v viral_consensus -i "../data/reads_$1.sam" -r NC_045512.fas -o "$LOG_DIR/consensus.fa" -q 20 -d 10 -f 0.5 -a N 2>viralconsensus_output.log
	update_stats viralconsensus

	echo $total_time_taken >"$LOG_DIR/time.log"
	echo $peak_memory >"$LOG_DIR/memory.log"

	rm -rf reads_$i.sam
	rm -rf fastp_output.log
	rm -rf minimap2_output.log
	rm -rf viralconsensus_output.log
}

for r in $(seq 1 $TEST_COUNT); do
	for i in 10000 20000 40000 100000 200000 400000; do
		run_benchmark $i "$i.$r"
	done
done
