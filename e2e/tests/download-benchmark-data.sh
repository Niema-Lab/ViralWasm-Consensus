SCRIPTPATH=$(dirname "$PWD")

# Download reads.fastq.gz file (1 milion sequences)
cd $SCRIPTPATH
mkdir data
cd data
curl -LO https://github.com/niemasd/ViralConsensus-Paper/raw/main/data/time_memory_benchmark/reads.fastq.gz
curl -LO https://github.com/Niema-Lab/ViralWasm-Consensus/raw/master/public/data/ref_genomes/NC_045512/NC_045512.fas
curl -LO https://github.com/Niema-Lab/ViralWasm-Consensus/raw/master/public/data/example.bam

minimap2 -t 1 -a -o reads_1000000.sam NC_045512.fas reads.fastq.gz

# Subsample: 100000 reads
seqtk sample -s100 reads.fastq.gz 100000 | gzip > reads_100000.fastq.gz 
minimap2 -t 1 -a -o reads_100000.sam NC_045512.fas reads_100000.fastq.gz

# Subsample: 10k reads
seqtk sample -s100 reads.fastq.gz 10000 | gzip > reads_10000.fastq.gz
minimap2 -t 1 -a -o reads_10000.sam NC_045512.fas reads_10000.fastq.gz

# Subsample: 1k reads
seqtk sample -s100 reads.fastq.gz 1000 | gzip > reads_1000.fastq.gz
minimap2 -t 1 -a -o reads_1000.sam NC_045512.fas reads_1000.fastq.gz