#ifndef FASTA_H
#define FASTA_H
#include <string>

// load reference genome from fasta
std::string read_fasta(const char* const in_ref_fn);
#endif