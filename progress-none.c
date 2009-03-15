#include <stdio.h>
#include <time.h>
#include <signal.h>

struct progress { };

inline void progress_init(struct progress * const pr, int pr_end) { }
inline void progress_update(struct progress * const pr, int pr_add) { }
inline void progress_end(struct progress * const pr) { }
