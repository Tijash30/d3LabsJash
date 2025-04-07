#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>

// Simulation parameters
#define N 1024          // Number of agents
#define D_MAX 30        // Maximum simulation days
#define M_MAX 10        // Maximum movements per day
#define L_MAX 5.0f      // Maximum radius for local movements (m)
#define R 1.0f          // Contagion limit distance (m)
#define P 500.0f        // Simulation area width (m)
#define Q 500.0f        // Simulation area height (m)

// Agent structure
typedef struct {
    // Attributes
    float p_con;        // Contagion probability [0.02, 0.03]
    float p_ext;        // External contagion probability [0.02, 0.03]
    float p_fat;        // Mortality probability [0.007, 0.07]
    float p_mov;        // Mobility probability [0.3, 0.5]
    float p_smo;        // Short distance mobility probability [0.7, 0.9]
    int t_inc;          // Incubation time [5, 6]
    int t_rec;          // Recovery time (14)
    int status;         // Infection status: 0=not infected, 1=infected, -1=quarantine, -2=deceased
    float x;            // Position in x [0, P]
    float y;            // Position in y [0, Q]
} Agent;

// Function to initialize random float in range [min, max]
float randomFloat(float min, float max) {
    return min + (max - min) * ((float)rand() / RAND_MAX);
}

// Function to initialize agents
void initializeAgents(Agent* agents) {
    for (int i = 0; i < N; i++) {
        agents[i].p_con = randomFloat(0.02f, 0.03f);
        agents[i].p_ext = randomFloat(0.02f, 0.03f);
        agents[i].p_fat = randomFloat(0.007f, 0.07f);
        agents[i].p_mov = randomFloat(0.3f, 0.5f);
        agents[i].p_smo = randomFloat(0.7f, 0.9f);
        agents[i].t_inc = (int)randomFloat(5.0f, 6.99f); // to get values 5 or 6
        agents[i].t_rec = 14;
        agents[i].status = 0; // Everyone starts not infected
        agents[i].x = randomFloat(0.0f, P);
        agents[i].y = randomFloat(0.0f, Q);
    }
}

// Calculate Euclidean distance between two agents
float distance(Agent a, Agent b) {
    float dx = a.x - b.x;
    float dy = a.y - b.y;
    return sqrtf(dx*dx + dy*dy);
}

// Rule 1: Contagion
void applyRule1(Agent* agents) {
    for (int i = 0; i < N; i++) {
        // Only apply rule to non-infected agents
        if (agents[i].status == 0) {
            int alpha = 0;
            
            // Check for infected neighbors within contagion radius
            for (int j = 0; j < N; j++) {
                if (i != j && agents[j].status > 0) { // if j is infected
                    if (distance(agents[i], agents[j]) <= R) {
                        alpha = 1;
                        break;
                    }
                }
            }
            
            // Apply contagion chance
            if (alpha == 1 && randomFloat(0.0f, 1.0f) <= agents[i].p_con) {
                agents[i].status = 1; // Agent becomes infected
            }
        }
    }
}

// Rule 2: Mobility
void applyRule2(Agent* agents) {
    for (int i = 0; i < N; i++) {
        // Skip deceased agents
        if (agents[i].status == -2) continue;
        
        // Check if agent decides to move
        if (randomFloat(0.0f, 1.0f) <= agents[i].p_mov) {
            // Decide if movement is local or distant
            if (randomFloat(0.0f, 1.0f) <= agents[i].p_smo) {
                // Local movement
                float movX = (2.0f * randomFloat(0.0f, 1.0f) - 1.0f) * L_MAX;
                float movY = (2.0f * randomFloat(0.0f, 1.0f) - 1.0f) * L_MAX;
                
                // Update position and ensure it's within bounds
                agents[i].x = fmaxf(0.0f, fminf(P, agents[i].x + movX));
                agents[i].y = fmaxf(0.0f, fminf(Q, agents[i].y + movY));
            } else {
                // Distant movement
                agents[i].x = randomFloat(0.0f, P);
                agents[i].y = randomFloat(0.0f, Q);
            }
        }
    }
}

// Rule 3: External contagion
void applyRule3(Agent* agents) {
    for (int i = 0; i < N; i++) {
        // Only non-infected agents can get external infection
        if (agents[i].status == 0) {
            // Apply external contagion chance
            if (randomFloat(0.0f, 1.0f) <= agents[i].p_ext) {
                agents[i].status = 1; // Agent becomes infected
            }
        }
    }
}

// Rule 4: Incubation, symptoms, quarantine, recovery
void applyRule4(Agent* agents) {
    for (int i = 0; i < N; i++) {
        // For infected agents, decrease incubation time
        if (agents[i].status > 0) {
            agents[i].t_inc--;
            
            // If incubation time is over, move to quarantine
            if (agents[i].t_inc <= 0) {
                agents[i].status = -1; // Move to quarantine
            }
        } 
        // For quarantined agents, decrease recovery time
        else if (agents[i].status == -1) {
            agents[i].t_rec--;
            
            // If recovery time is over, agent is recovered (immune)
            if (agents[i].t_rec <= 0) {
                agents[i].status = 0; // Back to not infected (but immune)
                // Reset recovery time for potential future infections
                agents[i].t_rec = 14;
            }
        }
    }
}

// Rule 5: Fatal cases
void applyRule5(Agent* agents) {
    for (int i = 0; i < N; i++) {
        // Only quarantined agents can die
        if (agents[i].status == -1) {
            // Apply fatality chance
            if (randomFloat(0.0f, 1.0f) <= agents[i].p_fat) {
                agents[i].status = -2; // Agent dies
            }
        }
    }
}

// Function to count agents by status
void countAgentsByStatus(Agent* agents, int* infected, int* quarantined, int* deceased) {
    *infected = 0;
    *quarantined = 0;
    *deceased = 0;
    
    for (int i = 0; i < N; i++) {
        if (agents[i].status == 1) (*infected)++;
        else if (agents[i].status == -1) (*quarantined)++;
        else if (agents[i].status == -2) (*deceased)++;
    }
}

// Main simulation function
void runSimulation() {
    // Seed random number generator
    srand(time(NULL));
    
    // Allocate memory for agents
    Agent* agents = (Agent*)malloc(N * sizeof(Agent));
    
    // Initialize agents
    initializeAgents(agents);
    
    // Track statistics
    int daily_infected[D_MAX] = {0};
    int daily_recovered[D_MAX] = {0};
    int daily_deaths[D_MAX] = {0};
    int cumulative_infected[D_MAX] = {0};
    int cumulative_recovered[D_MAX] = {0};
    int cumulative_deaths[D_MAX] = {0};
    
    int day_first_infected = -1;
    int day_half_infected = -1;
    int day_all_infected = -1;
    
    int day_first_recovered = -1;
    int day_half_recovered = -1;
    int day_all_recovered = -1;
    
    int day_first_death = -1;
    int day_half_deaths = -1;
    int day_all_deaths = -1;
    
    // Variables to track yesterday's totals for calculating daily changes
    int prev_total_infected = 0;
    int prev_total_recovered = 0;
    int prev_total_deceased = 0;
    
    // Start simulation timer
    clock_t start_time = clock();
    
    // Simulation loop
    for (int day = 0; day < D_MAX; day++) {
        // Daily in-campus simulation (multiple movements)
        for (int mov = 0; mov < M_MAX; mov++) {
            applyRule1(agents); // Apply contagion
            applyRule2(agents); // Apply mobility
        }
        
        // End of workday: apply external contagion, incubation, and mortality
        applyRule3(agents);
        applyRule4(agents);
        applyRule5(agents);
        
        // Count agents by status
        int infected, quarantined, deceased;
        countAgentsByStatus(agents, &infected, &quarantined, &deceased);
        
        // Calculate daily statistics
        int total_infected = infected + quarantined + deceased + cumulative_recovered[day > 0 ? day-1 : 0];
        int total_recovered = (day > 0) ? cumulative_recovered[day-1] : 0;
        int total_deceased = deceased;
        
        // Calculate daily changes
        daily_infected[day] = total_infected - prev_total_infected;
        daily_recovered[day] = total_recovered - prev_total_recovered;
        daily_deaths[day] = total_deceased - prev_total_deceased;
        
        // Update cumulative counts
        cumulative_infected[day] = total_infected;
        cumulative_recovered[day] = total_recovered;
        cumulative_deaths[day] = total_deceased;
        
        // Update previous totals for next iteration
        prev_total_infected = total_infected;
        prev_total_recovered = total_recovered;
        prev_total_deceased = total_deceased;
        
        // Record key milestone days
        if (total_infected > 0 && day_first_infected == -1) day_first_infected = day;
        if (total_infected >= N/2 && day_half_infected == -1) day_half_infected = day;
        if (total_infected >= N && day_all_infected == -1) day_all_infected = day;
        
        if (total_recovered > 0 && day_first_recovered == -1) day_first_recovered = day;
        if (total_recovered >= N/2 && day_half_recovered == -1) day_half_recovered = day;
        if (total_recovered >= N && day_all_recovered == -1) day_all_recovered = day;
        
        if (total_deceased > 0 && day_first_death == -1) day_first_death = day;
        if (total_deceased >= N/2 && day_half_deaths == -1) day_half_deaths = day;
        if (total_deceased >= N && day_all_deaths == -1) day_all_deaths = day;
    }
    
    // End simulation timer
    clock_t end_time = clock();
    double cpu_time = (double)(end_time - start_time) / CLOCKS_PER_SEC;
    
    // Report results
    printf("================ COVID-19 SIMULATION RESULTS (CPU) ================\n");
    printf("Simulation Parameters:\n");
    printf("  Number of agents: %d\n", N);
    printf("  Simulation days: %d\n", D_MAX);
    printf("  Movements per day: %d\n", M_MAX);
    
    printf("\nDaily Statistics:\n");
    printf("Day | New Infections | New Recoveries | New Deaths | Cumulative Infected | Cumulative Recovered | Cumulative Deaths\n");
    printf("---------------------------------------------------------------------------------------------\n");
    
    for (int day = 0; day < D_MAX; day++) {
        printf("%3d | %14d | %14d | %10d | %19d | %20d | %16d\n",
               day + 1, daily_infected[day], daily_recovered[day], daily_deaths[day],
               cumulative_infected[day], cumulative_recovered[day], cumulative_deaths[day]);
    }
    
    printf("\nKey Milestones:\n");
    printf("First infection: Day %d\n", day_first_infected != -1 ? day_first_infected + 1 : -1);
    printf("50%% infected: Day %d\n", day_half_infected != -1 ? day_half_infected + 1 : -1);
    printf("100%% infected: Day %d\n", day_all_infected != -1 ? day_all_infected + 1 : -1);
    
    printf("First recovery: Day %d\n", day_first_recovered != -1 ? day_first_recovered + 1 : -1);
    printf("50%% recovered: Day %d\n", day_half_recovered != -1 ? day_half_recovered + 1 : -1);
    printf("100%% recovered: Day %d\n", day_all_recovered != -1 ? day_all_recovered + 1 : -1);
    
    printf("First death: Day %d\n", day_first_death != -1 ? day_first_death + 1 : -1);
    printf("50%% deaths: Day %d\n", day_half_deaths != -1 ? day_half_deaths + 1 : -1);
    printf("100%% deaths: Day %d\n", day_all_deaths != -1 ? day_all_deaths + 1 : -1);
    
    printf("\nExecution Time (CPU): %.6f seconds\n", cpu_time);
    
    // Free memory
    free(agents);
}

int main() {
    runSimulation();
    return 0;
}