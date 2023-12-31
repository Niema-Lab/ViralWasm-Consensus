TEST_COUNT=5

cd ../../benchmarks

rm summary.log

for p in chromium cli; do
	for n in 10000 20000 40000 100000 200000 400000; do
		average_memory=0
		average_time=0
		for r in $(seq 1 $TEST_COUNT); do
			cd "$n.$r/$p"
			memory=$(cat memory.log)
			average_memory=$(echo "$memory + $average_memory" | bc)
			time=$(cat time.log)
			average_time=$(echo "$time + $average_time" | bc)
			cd ../../
		done
		average_memory=$(echo "$average_memory / $TEST_COUNT" | bc)
		average_time=$(echo "scale=3; $average_time / $TEST_COUNT" | bc)
		echo "$p $n sequences, average runtime: $average_time seconds, average peak memory: $average_memory KB" >> summary.log
	done
done
