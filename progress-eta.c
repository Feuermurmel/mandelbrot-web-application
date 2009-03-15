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
	int pr_next; // Next update check
	int pr_last; // At last update, zero if not yet tracking pr_per_second
	int pr_curr; // Current, continous progress
	clock_t time_begin; // At beginning
	clock_t time_last; // At last update
	double pr_per_second; // Running average of progress units per second.
};

#define CLEAR_LINE "\e[2K\e[1G"
#define AVERAGING_TIME 50.
#define PROGRESS_STEP 10000

inline void progress_init(struct progress * const pr, int pr_end) {
	pr->time_begin = clock();
	pr->time_last = pr->time_begin;
	pr->pr_last = 0;
	pr->pr_curr = 0;
	pr->pr_next = PROGRESS_STEP;
	pr->pr_end = pr_end;
	pr->pr_per_second = 0.;
	
	signals_install();
}

inline void progress_update(struct progress * const pr, int pr_add) {
	pr->pr_curr += pr_add;
	
	if (pr->pr_curr > pr->pr_next) {
		clock_t time_now = clock();
		double time_passed = (double) (time_now - pr->time_last) / CLOCKS_PER_SEC;
		
		if (time_passed > .5) {
			if (pr->pr_last == 0) {	
				double time_total = (double) (time_now - pr->time_begin) / CLOCKS_PER_SEC;
				
				fprintf(stderr,
					CLEAR_LINE "%.1f%% (%d/%d kpx) done ",
					(double) pr->pr_curr / pr->pr_end * 100,
					pr->pr_curr / 1000,
					pr->pr_end / 1000
				);
				
				if (time_total > 5.) {
					pr->pr_per_second = (double) pr->pr_curr / time_total;
					pr->pr_last = pr->pr_curr;
				}
			} else {
				double pr_per_second = (double) (pr->pr_curr - pr->pr_last) / time_passed;
				
				pr->pr_per_second = ((AVERAGING_TIME - time_passed) * pr->pr_per_second + pr_per_second * time_passed) / AVERAGING_TIME;
				
				fprintf(stderr,
					CLEAR_LINE "%.1f%% (%d/%d kpx) done | %.0f kpx/s, ETA %.0f s ",
					(double) pr->pr_curr / pr->pr_end * 100,
					pr->pr_curr / 1000,
					pr->pr_end / 1000,
					pr_per_second / 1000,
					(double) (pr->pr_end - pr->pr_curr) / pr_per_second
				);
				
				pr->pr_last = pr->pr_curr;
			}
			
			pr->time_last = time_now;
		}
		
		pr->pr_next += PROGRESS_STEP;
	}
}

void progress_end(struct progress * const pr) {
	fprintf(stderr, CLEAR_LINE);
}
