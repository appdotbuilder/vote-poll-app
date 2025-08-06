
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Share2, Vote, TrendingUp, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PollWithOptions, VoteSummary } from '../../server/src/schema';

function App() {
  const [polls, setPolls] = useState<PollWithOptions[]>([]);
  const [voteSummaries, setVoteSummaries] = useState<Map<number, VoteSummary>>(new Map());
  const [votingStatus, setVotingStatus] = useState<Map<number, 'idle' | 'voting' | 'voted' | 'ineligible'>>(new Map());
  const [userIP, setUserIP] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user IP address
  useEffect(() => {
    const fetchUserIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIP(data.ip);
      } catch (err) {
        console.error('Failed to get IP address:', err);
        // Fallback to a default IP if the service is unavailable
        setUserIP('127.0.0.1');
      }
    };
    
    fetchUserIP();
  }, []);

  const loadPolls = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getPolls.query();
      setPolls(result);
      
      // Load vote summaries for each poll
      const summaries = new Map<number, VoteSummary>();
      const eligibilityMap = new Map<number, 'idle' | 'voting' | 'voted' | 'ineligible'>();
      
      for (const poll of result) {
        try {
          const summary = await trpc.getVoteSummary.query(poll.id);
          summaries.set(poll.id, summary);
          
          // Check vote eligibility
          const canVote = await trpc.checkVoteEligibility.query({
            pollId: poll.id,
            ipAddress: userIP
          });
          eligibilityMap.set(poll.id, canVote ? 'idle' : 'ineligible');
        } catch (err) {
          console.error(`Failed to load data for poll ${poll.id}:`, err);
        }
      }
      
      setVoteSummaries(summaries);
      setVotingStatus(eligibilityMap);
    } catch (err) {
      console.error('Failed to load polls:', err);
      setError('Failed to load polls. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userIP]);

  useEffect(() => {
    if (userIP) {
      loadPolls();
    }
  }, [loadPolls, userIP]);

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      setVotingStatus(prev => new Map(prev).set(pollId, 'voting'));
      
      await trpc.vote.mutate({
        poll_id: pollId,
        poll_option_id: optionId,
        ip_address: userIP
      });
      
      // Refresh vote summary for this poll
      const updatedSummary = await trpc.getVoteSummary.query(pollId);
      setVoteSummaries(prev => new Map(prev).set(pollId, updatedSummary));
      setVotingStatus(prev => new Map(prev).set(pollId, 'voted'));
    } catch (err) {
      console.error('Failed to vote:', err);
      setVotingStatus(prev => new Map(prev).set(pollId, 'idle'));
      setError('Failed to record vote. You may have already voted on this poll.');
    }
  };

  const handleShare = (poll: PollWithOptions) => {
    const shareData = {
      title: poll.title,
      text: poll.description || `Vote on: ${poll.title}`,
      url: `${window.location.origin}?poll=${poll.id}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.url);
      alert('Poll link copied to clipboard!');
    }
  };

  const getVotePercentage = (pollId: number, optionId: number): number => {
    const summary = voteSummaries.get(pollId);
    if (!summary || summary.total_votes === 0) return 0;
    
    const option = summary.options.find(opt => opt.option_id === optionId);
    return option?.percentage || 0;
  };

  const getVoteCount = (pollId: number, optionId: number): number => {
    const summary = voteSummaries.get(pollId);
    if (!summary) return 0;
    
    const option = summary.options.find(opt => opt.option_id === optionId);
    return option?.vote_count || 0;
  };

  const getTotalVotes = (pollId: number): number => {
    const summary = voteSummaries.get(pollId);
    return summary?.total_votes || 0;
  };

  // Separate popular and recent polls
  const popularPolls = polls.filter(poll => poll.popularity_score > 50).slice(0, 3);
  const recentPolls = polls.filter(poll => poll.popularity_score <= 50);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">📊 Community Polls</h1>
          <p className="text-gray-600 mt-2">Share your opinion and see what others think</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Note about backend implementation status */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            <strong>Development Status:</strong> This frontend is connected to placeholder backend handlers. 
            Poll data will be displayed once the backend implementation is completed.
          </AlertDescription>
        </Alert>

        {polls.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🗳️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No polls available</h2>
            <p className="text-gray-600">Check back later for new polls to vote on!</p>
          </Card>
        ) : (
          <div className="space-y-12">
            {/* Popular Polls Section */}
            {popularPolls.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <h2 className="text-2xl font-bold text-gray-900">🔥 Trending Polls</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {popularPolls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      isPopular={true}
                      votingStatus={votingStatus.get(poll.id) || 'idle'}
                      onVote={handleVote}
                      onShare={handleShare}
                      getVotePercentage={getVotePercentage}
                      getVoteCount={getVoteCount}
                      getTotalVotes={getTotalVotes}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Recent Polls Section */}
            {recentPolls.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">🆕 Latest Polls</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recentPolls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      isPopular={false}
                      votingStatus={votingStatus.get(poll.id) || 'idle'}
                      onVote={handleVote}
                      onShare={handleShare}
                      getVotePercentage={getVotePercentage}
                      getVoteCount={getVoteCount}
                      getTotalVotes={getTotalVotes}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface PollCardProps {
  poll: PollWithOptions;
  isPopular: boolean;
  votingStatus: 'idle' | 'voting' | 'voted' | 'ineligible';
  onVote: (pollId: number, optionId: number) => void;
  onShare: (poll: PollWithOptions) => void;
  getVotePercentage: (pollId: number, optionId: number) => number;
  getVoteCount: (pollId: number, optionId: number) => number;
  getTotalVotes: (pollId: number) => number;
}

function PollCard({
  poll,
  isPopular,
  votingStatus,
  onVote,
  onShare,
  getVotePercentage,
  getVoteCount,
  getTotalVotes
}: PollCardProps) {
  const totalVotes = getTotalVotes(poll.id);
  const hasVoted = votingStatus === 'voted' || votingStatus === 'ineligible';

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
      isPopular ? 'ring-2 ring-orange-200' : ''
    }`}>
      {/* Cover Photo */}
      {poll.cover_photo_url && (
        <div className={`relative ${isPopular ? 'h-48' : 'h-32'}`}>
          <img
            src={poll.cover_photo_url}
            alt={poll.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {isPopular && (
            <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600">
              🔥 Trending
            </Badge>
          )}
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Poll Header */}
        <div>
          <h3 className={`font-semibold text-gray-900 line-clamp-2 ${
            isPopular ? 'text-lg' : 'text-base'
          }`}>
            {poll.title}
          </h3>
          {poll.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{poll.description}</p>
          )}
        </div>

        {/* Vote Count and Status */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Vote className="h-4 w-4" />
            {totalVotes} votes
          </span>
          <span>
            {new Date(poll.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Poll Options */}
        <div className="space-y-3">
          {poll.options.map((option) => {
            const percentage = getVotePercentage(poll.id, option.id);
            const voteCount = getVoteCount(poll.id, option.id);

            return (
              <div key={option.id} className="space-y-2">
                {/* Option with thumbnail */}
                <div className="flex items-center gap-3">
                  {option.thumbnail_url && (
                    <img
                      src={option.thumbnail_url}
                      alt={option.option_text}
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {option.option_text}
                      </span>
                      {hasVoted && (
                        <span className="text-xs text-gray-500">
                          {voteCount} ({percentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    
                    {hasVoted ? (
                      <Progress value={percentage} className="h-2" />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onVote(poll.id, option.id)}
                        disabled={votingStatus === 'voting'}
                      >
                        {votingStatus === 'voting' ? 'Voting...' : 'Vote'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Voting Status Message */}
        {votingStatus === 'voted' && (
          <div className="text-sm text-green-600 font-medium">
            ✅ Thank you for voting!
          </div>
        )}
        {votingStatus === 'ineligible' && (
          <div className="text-sm text-gray-500">
            🚫 You have already voted on this poll
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShare(poll)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          {poll.popularity_score > 0 && (
            <Badge variant="secondary" className="text-xs">
              Score: {poll.popularity_score.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

export default App;
