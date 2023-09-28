cd ../data

# Full reads.fastq.gz test
{
  time {
    minimap2 -t 1 -a -o reads.sam NC_045512.2.fas reads.fastq.gz && \
    viral_consensus -i reads.sam -r NC_045512.2.fas -o ../../benchmarks/consensus.fa -q 20 -d 10 -f 0.5 -a N
  }
} 2> time_output.log

# Extract real time from the time output and append/write to full-run-time.log
grep "real" time_output.log | awk -F'[ms]' '{print $2 + $3}' > ../../benchmarks/full-run-time.log

rm time_output.log
rm reads.sam



