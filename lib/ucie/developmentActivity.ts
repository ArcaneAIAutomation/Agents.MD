/**
 * Development Activity Tracking
 * 
 * This module provides functions for tracking protocol development activity
 * from GitHub and other sources.
 * 
 * Requirements: 18.4
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface GitHubRepoData {
  owner: string;
  repo: string;
  stars: number;
  watchers: number;
  forks: number;
  openIssues: number;
  commits: {
    last30Days: number;
    last90Days: number;
    last1Year: number;
  };
  contributors: {
    total: number;
    active30Days: number;
    active90Days: number;
  };
  lastCommitDate: string;
  createdAt: string;
  updatedAt: string;
  language: string;
  languages: Record<string, number>;
}

export interface DevelopmentMetrics {
  commits30d: number;
  commits90d: number;
  commits1y: number;
  activeDevelopers: number;
  totalContributors: number;
  codeQuality: number;              // 0-100
  developmentTrend: 'increasing' | 'stable' | 'decreasing' | 'inactive';
  lastActivityDays: number;
  activityScore: number;            // 0-100
  healthScore: number;              // 0-100
}

export interface DevelopmentAnalysis {
  metrics: DevelopmentMetrics;
  category: 'inactive' | 'low' | 'moderate' | 'active' | 'very_active';
  githubRepos: GitHubRepoData[];
  strengths: string[];
  concerns: string[];
  monthlyTrend: {
    month: string;
    commits: number;
    contributors: number;
  }[];
}

// ============================================================================
// GitHub API Client
// ============================================================================

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Fetch GitHub repository data
 */
export async function fetchGitHubRepo(owner: string, repo: string): Promise<GitHubRepoData | null> {
  try {
    // Fetch basic repo info
    const repoResponse = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add 'Authorization: Bearer YOUR_GITHUB_TOKEN' for higher rate limits
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!repoResponse.ok) {
      console.warn(`GitHub repo fetch failed: ${repoResponse.status}`);
      return null;
    }

    const repoData = await repoResponse.json();

    // Fetch commit activity
    const commitsData = await fetchCommitActivity(owner, repo);
    
    // Fetch contributors
    const contributorsData = await fetchContributors(owner, repo);

    return {
      owner,
      repo,
      stars: repoData.stargazers_count || 0,
      watchers: repoData.watchers_count || 0,
      forks: repoData.forks_count || 0,
      openIssues: repoData.open_issues_count || 0,
      commits: commitsData,
      contributors: contributorsData,
      lastCommitDate: repoData.pushed_at || repoData.updated_at,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      language: repoData.language || 'Unknown',
      languages: {}, // Would need separate API call
    };
  } catch (error) {
    console.error('Error fetching GitHub repo:', error);
    return null;
  }
}

/**
 * Fetch commit activity for a repository
 */
async function fetchCommitActivity(owner: string, repo: string): Promise<{
  last30Days: number;
  last90Days: number;
  last1Year: number;
}> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/stats/commit_activity`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return { last30Days: 0, last90Days: 0, last1Year: 0 };
    }

    const data = await response.json();
    
    // Data is weekly commit counts for the last year
    if (!Array.isArray(data) || data.length === 0) {
      return { last30Days: 0, last90Days: 0, last1Year: 0 };
    }

    // Calculate commits for different periods
    const last4Weeks = data.slice(-4);
    const last13Weeks = data.slice(-13);
    const lastYear = data;

    const last30Days = last4Weeks.reduce((sum, week) => sum + week.total, 0);
    const last90Days = last13Weeks.reduce((sum, week) => sum + week.total, 0);
    const last1Year = lastYear.reduce((sum, week) => sum + week.total, 0);

    return { last30Days, last90Days, last1Year };
  } catch (error) {
    console.error('Error fetching commit activity:', error);
    return { last30Days: 0, last90Days: 0, last1Year: 0 };
  }
}

/**
 * Fetch contributors for a repository
 */
async function fetchContributors(owner: string, repo: string): Promise<{
  total: number;
  active30Days: number;
  active90Days: number;
}> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return { total: 0, active30Days: 0, active90Days: 0 };
    }

    const contributors = await response.json();
    
    // Note: GitHub API doesn't provide recent activity per contributor easily
    // This is a simplified estimate
    const total = contributors.length;
    const active30Days = Math.ceil(total * 0.3); // Estimate 30% active
    const active90Days = Math.ceil(total * 0.5); // Estimate 50% active

    return { total, active30Days, active90Days };
  } catch (error) {
    console.error('Error fetching contributors:', error);
    return { total: 0, active30Days: 0, active90Days: 0 };
  }
}

/**
 * Search for GitHub repositories by token symbol
 */
export async function searchGitHubRepos(symbol: string, projectName?: string): Promise<string[]> {
  try {
    const query = projectName || symbol;
    const response = await fetch(
      `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}+crypto+blockchain&sort=stars&per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.items?.map((item: any) => `${item.owner.login}/${item.name}`) || [];
  } catch (error) {
    console.error('Error searching GitHub repos:', error);
    return [];
  }
}

// ============================================================================
// Development Metrics Calculation
// ============================================================================

/**
 * Calculate development metrics from GitHub data
 */
export function calculateDevelopmentMetrics(repos: GitHubRepoData[]): DevelopmentMetrics {
  if (repos.length === 0) {
    return {
      commits30d: 0,
      commits90d: 0,
      commits1y: 0,
      activeDevelopers: 0,
      totalContributors: 0,
      codeQuality: 0,
      developmentTrend: 'inactive',
      lastActivityDays: 999,
      activityScore: 0,
      healthScore: 0,
    };
  }

  // Aggregate metrics across all repos
  const commits30d = repos.reduce((sum, repo) => sum + repo.commits.last30Days, 0);
  const commits90d = repos.reduce((sum, repo) => sum + repo.commits.last90Days, 0);
  const commits1y = repos.reduce((sum, repo) => sum + repo.commits.last1Year, 0);
  const activeDevelopers = repos.reduce((sum, repo) => sum + repo.contributors.active30Days, 0);
  const totalContributors = repos.reduce((sum, repo) => sum + repo.contributors.total, 0);

  // Calculate code quality score
  const codeQuality = calculateCodeQuality(repos);

  // Determine development trend
  const developmentTrend = determineDevelopmentTrend(commits30d, commits90d, commits1y);

  // Calculate days since last activity
  const lastActivityDays = calculateDaysSinceLastActivity(repos);

  // Calculate activity score
  const activityScore = calculateActivityScore(commits30d, activeDevelopers, lastActivityDays);

  // Calculate overall health score
  const healthScore = calculateHealthScore({
    commits30d,
    commits90d,
    commits1y,
    activeDevelopers,
    totalContributors,
    codeQuality,
    developmentTrend,
    lastActivityDays,
    activityScore,
    healthScore: 0,
  });

  return {
    commits30d,
    commits90d,
    commits1y,
    activeDevelopers,
    totalContributors,
    codeQuality,
    developmentTrend,
    lastActivityDays,
    activityScore,
    healthScore,
  };
}

/**
 * Calculate code quality score (0-100)
 */
function calculateCodeQuality(repos: GitHubRepoData[]): number {
  let score = 50; // Base score

  const avgStars = repos.reduce((sum, repo) => sum + repo.stars, 0) / repos.length;
  const avgForks = repos.reduce((sum, repo) => sum + repo.forks, 0) / repos.length;
  const avgContributors = repos.reduce((sum, repo) => sum + repo.contributors.total, 0) / repos.length;

  // Stars indicate community approval
  if (avgStars > 1000) score += 20;
  else if (avgStars > 500) score += 15;
  else if (avgStars > 100) score += 10;
  else if (avgStars > 50) score += 5;

  // Forks indicate code reuse
  if (avgForks > 200) score += 15;
  else if (avgForks > 100) score += 10;
  else if (avgForks > 50) score += 5;

  // Contributors indicate collaboration
  if (avgContributors > 50) score += 15;
  else if (avgContributors > 20) score += 10;
  else if (avgContributors > 10) score += 5;

  return Math.min(100, score);
}

/**
 * Determine development trend
 */
function determineDevelopmentTrend(
  commits30d: number,
  commits90d: number,
  commits1y: number
): 'increasing' | 'stable' | 'decreasing' | 'inactive' {
  if (commits30d === 0) return 'inactive';

  const avg30d = commits30d;
  const avg90d = commits90d / 3;
  const avg1y = commits1y / 12;

  // Compare recent activity to longer-term averages
  if (avg30d > avg90d * 1.2 && avg30d > avg1y * 1.2) {
    return 'increasing';
  } else if (avg30d < avg90d * 0.8 && avg30d < avg1y * 0.8) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

/**
 * Calculate days since last activity
 */
function calculateDaysSinceLastActivity(repos: GitHubRepoData[]): number {
  if (repos.length === 0) return 999;

  const mostRecentDate = repos.reduce((latest, repo) => {
    const repoDate = new Date(repo.lastCommitDate);
    return repoDate > latest ? repoDate : latest;
  }, new Date(0));

  const daysSince = Math.floor((Date.now() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSince;
}

/**
 * Calculate activity score (0-100)
 */
function calculateActivityScore(
  commits30d: number,
  activeDevelopers: number,
  lastActivityDays: number
): number {
  let score = 0;

  // Commits score (40 points max)
  if (commits30d > 100) score += 40;
  else if (commits30d > 50) score += 30;
  else if (commits30d > 20) score += 20;
  else if (commits30d > 5) score += 10;

  // Active developers score (30 points max)
  if (activeDevelopers > 20) score += 30;
  else if (activeDevelopers > 10) score += 20;
  else if (activeDevelopers > 5) score += 15;
  else if (activeDevelopers > 2) score += 10;
  else if (activeDevelopers > 0) score += 5;

  // Recency score (30 points max)
  if (lastActivityDays < 7) score += 30;
  else if (lastActivityDays < 14) score += 20;
  else if (lastActivityDays < 30) score += 10;
  else if (lastActivityDays < 90) score += 5;

  return Math.min(100, score);
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(metrics: DevelopmentMetrics): number {
  let score = 0;

  // Activity score (40 points)
  score += metrics.activityScore * 0.4;

  // Code quality (30 points)
  score += metrics.codeQuality * 0.3;

  // Trend (20 points)
  const trendScores = {
    increasing: 20,
    stable: 15,
    decreasing: 5,
    inactive: 0,
  };
  score += trendScores[metrics.developmentTrend];

  // Contributors (10 points)
  if (metrics.totalContributors > 50) score += 10;
  else if (metrics.totalContributors > 20) score += 7;
  else if (metrics.totalContributors > 10) score += 5;
  else if (metrics.totalContributors > 5) score += 3;

  return Math.round(Math.min(100, score));
}

/**
 * Analyze development activity comprehensively
 */
export function analyzeDevelopmentActivity(repos: GitHubRepoData[]): DevelopmentAnalysis {
  const metrics = calculateDevelopmentMetrics(repos);
  
  // Categorize activity level
  const category = categorizeActivity(metrics.activityScore);
  
  // Identify strengths and concerns
  const strengths = identifyStrengths(metrics, repos);
  const concerns = identifyConcerns(metrics, repos);
  
  // Generate monthly trend (simplified)
  const monthlyTrend = generateMonthlyTrend(metrics);

  return {
    metrics,
    category,
    githubRepos: repos,
    strengths,
    concerns,
    monthlyTrend,
  };
}

/**
 * Categorize activity level
 */
function categorizeActivity(activityScore: number): 'inactive' | 'low' | 'moderate' | 'active' | 'very_active' {
  if (activityScore < 20) return 'inactive';
  if (activityScore < 40) return 'low';
  if (activityScore < 60) return 'moderate';
  if (activityScore < 80) return 'active';
  return 'very_active';
}

/**
 * Identify development strengths
 */
function identifyStrengths(metrics: DevelopmentMetrics, repos: GitHubRepoData[]): string[] {
  const strengths: string[] = [];

  if (metrics.commits30d > 50) {
    strengths.push('High commit frequency indicates active development');
  }

  if (metrics.activeDevelopers > 10) {
    strengths.push('Large active developer community');
  }

  if (metrics.codeQuality > 70) {
    strengths.push('High code quality with strong community engagement');
  }

  if (metrics.developmentTrend === 'increasing') {
    strengths.push('Development activity is accelerating');
  }

  if (metrics.lastActivityDays < 7) {
    strengths.push('Very recent development activity');
  }

  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
  if (totalStars > 1000) {
    strengths.push('Strong community support with high GitHub stars');
  }

  return strengths;
}

/**
 * Identify development concerns
 */
function identifyConcerns(metrics: DevelopmentMetrics, repos: GitHubRepoData[]): string[] {
  const concerns: string[] = [];

  if (metrics.commits30d < 5) {
    concerns.push('Low commit frequency may indicate slow development');
  }

  if (metrics.activeDevelopers < 3) {
    concerns.push('Small developer team - bus factor risk');
  }

  if (metrics.developmentTrend === 'decreasing') {
    concerns.push('Development activity is declining');
  }

  if (metrics.developmentTrend === 'inactive') {
    concerns.push('Project appears to be inactive or abandoned');
  }

  if (metrics.lastActivityDays > 90) {
    concerns.push('No recent development activity (90+ days)');
  }

  if (metrics.codeQuality < 40) {
    concerns.push('Low code quality indicators');
  }

  return concerns;
}

/**
 * Generate monthly trend data (simplified)
 */
function generateMonthlyTrend(metrics: DevelopmentMetrics): Array<{
  month: string;
  commits: number;
  contributors: number;
}> {
  // This is a simplified version - in reality would use historical data
  const months = ['3 months ago', '2 months ago', '1 month ago', 'Current'];
  const avgMonthlyCommits = metrics.commits90d / 3;
  
  return months.map((month, index) => ({
    month,
    commits: Math.round(avgMonthlyCommits * (0.8 + index * 0.1)),
    contributors: Math.round(metrics.activeDevelopers * (0.7 + index * 0.1)),
  }));
}

/**
 * Generate development activity description
 */
export function generateDevelopmentDescription(analysis: DevelopmentAnalysis): string {
  const { metrics, category } = analysis;
  
  let categoryDesc = '';
  switch (category) {
    case 'inactive':
      categoryDesc = 'inactive';
      break;
    case 'low':
      categoryDesc = 'low activity';
      break;
    case 'moderate':
      categoryDesc = 'moderate activity';
      break;
    case 'active':
      categoryDesc = 'active development';
      break;
    case 'very_active':
      categoryDesc = 'very active development';
      break;
  }

  return `This protocol has ${categoryDesc} with ${metrics.commits30d} commits in the last 30 days ` +
         `and ${metrics.activeDevelopers} active developers. ` +
         `Development trend is ${metrics.developmentTrend}. ` +
         `Overall health score: ${metrics.healthScore}/100.`;
}
