SCRIPTPATH=$(dirname "$PWD")

# Download reads.fastq.gz file (1 milion sequences)
cd $SCRIPTPATH
mkdir data
cd data
curl -LO https://github.com/niemasd/ViralConsensus-Paper/raw/main/data/time_memory_benchmark/reads.fastq.gz
curl -LO https://github.com/Niema-Lab/ViralWasm-Consensus/raw/master/public/data/ref_genomes/NC_045512/NC_045512.fas

for n in 1000 10000 20000 100000 200000; do
	seqtk sample -s100 reads.fastq.gz $n | gzip > reads_$n.fastq.gz
done