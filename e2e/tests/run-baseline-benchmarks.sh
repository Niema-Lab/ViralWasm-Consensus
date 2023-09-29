cd ../data



### TEST #1: Example data
OUT_DIR=../../benchmarks/example-uploaded/cli/
mkdir -p $OUT_DIR

/usr/bin/time -v viral_consensus -i example.bam -r NC_045512.2.fas -o "$OUT_DIR/consensus.fa" -q 20 -d 10 -f 0.5 -a N 2> time_output.log

grep "User time (seconds): " time_output.log | awk '{print $4}' > "$OUT_DIR/time.log"
grep "Maximum resident set size (kbytes): " time_output.log | awk '{print $6}' > "$OUT_DIR/memory.log"

rm time_output.log

### TEST #2: Full reads.fastq.gz file 
OUT_DIR=../../benchmarks/large-dataset/cli/
mkdir -p $OUT_DIR

minimap2 -t 1 -a -o reads.sam NC_045512.2.fas reads.fastq.gz
/usr/bin/time -v viral_consensus -i reads.sam -r NC_045512.2.fas -o "$OUT_DIR/consensus.fa" -q 20 -d 10 -f 0.5 -a N 2> time_output.log

grep "User time (seconds): " time_output.log | awk '{print $4}' > "$OUT_DIR/time.log"
grep "Maximum resident set size (kbytes): " time_output.log | awk '{print $6}' > "$OUT_DIR/memory.log"

rm reads.sam
rm time_output.log



