#include <stdio.h>
#include <time.h>
#include <signal.h>

void signals_handle (int signum) {
	fprintf(stderr, "\n");
	exit(1);
}

void signals_install(void) {
	if (signal (SIGINT, signals_handle) == SIG_IGN)
		signal (SIGINT, SIG_IGN);
	if (signal (SIGHUP, signals_handle) == SIG_IGN)
		signal (SIGHUP, SIG_IGN);
	if (signal (SIGTERM, signals_handle) == SIG_IGN)
		signal (SIGTERM, SIG_IGN);
}

struct progress {
	int pr_end; // Final number of progress units.
	int pr_curr; // Current, continous progress
	int pr_next; // Next update check
	int pr_next_upd; // Next update
	clock_t time_next; // Next update
};

#define CLEAR_LINE "\e[2K\e[1G"
#define PROGRESS_STEP 10000

inline void progress_init(struct progress * const pr, int pr_end) {
	pr->time_next = clock();
	pr->pr_curr = 0;
	pr->pr_next = 0;
	pr->pr_next_upd = 0;
	pr->pr_end = pr_end;
	
	signals_install();
}

inline void progress_update(struct progress * const pr, int pr_add) {
	pr->pr_curr += pr_add;
	
	if (pr->pr_curr > pr->pr_next) {
		if (clock() > pr->time_next || pr->pr_curr > pr->pr_next_upd) {
			fprintf(stderr,
				CLEAR_LINE "%.1f%% (%d/%d kpx) done ",
				(double) pr->pr_curr / pr->pr_end * 100,
				pr->pr_curr / 1000,
				pr->pr_end / 1000
			);
			
			pr->time_next += CLOCKS_PER_SEC;
			pr->pr_next_upd = pr->pr_curr + pr->pr_end / 100;
		}
		
		pr->pr_next += PROGRESS_STEP;
	}
}

inline void progress_end(struct progress * const pr) {
	fprintf(stderr, CLEAR_LINE);
}
