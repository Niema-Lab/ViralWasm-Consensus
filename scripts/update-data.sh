VIRALCONSENSUS_DATA_DIR='../public/data/'

# update data
cd $VIRALCONSENSUS_DATA_DIR
rm -rf Reference-Genomes/
git clone https://github.com/Niema-Lab/Reference-Genomes.git
cd Reference-Genomes
rm -rf .github/
rm -rf .git/
python3 compile.py
mv REFS.json ../REFS.json
