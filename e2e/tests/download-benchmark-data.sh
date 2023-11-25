TEST_COUNT=5
SCRIPTPATH=$(dirname "$PWD")

# Download reads.fastq.gz file (1 milion sequences)
cd $SCRIPTPATH
mkdir data
cd data
curl -LO https://github.com/niemasd/ViralConsensus-Paper/raw/main/data/time_memory_benchmark/reads.fastq.gz
curl -LO https://github.com/Niema-Lab/ViralWasm-Consensus/raw/master/public/data/ref_genomes/NC_045512/NC_045512.fas

for n in 10000 20000 40000 100000 200000 400000; do
	for r in $(seq 1 $TEST_COUNT); do
		seed=$(($r * 100))
		seqtk sample -s$seed reads.fastq.gz $n | gzip >reads.$n.$r.fastq.gz
	done
done

zcat reads.fastq.gz | awk 'NR<=2000000' | gzip > reads.500000.1.fastq.gz
zcat reads.fastq.gz | awk 'NR>2000000 && NR<=4000000' | gzip > reads.500000.2.fastq.gz
