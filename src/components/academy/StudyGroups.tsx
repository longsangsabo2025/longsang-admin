/**
 * Study Groups Component
 * Auto-matching study groups by level
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface StudyGroup {
  id: string;
  name: string;
  level: string;
  description: string;
  member_count: number;
  max_members: number;
  created_at: string;
}

export function StudyGroups({ userId, userLevel }: { userId: string; userLevel: number }) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroup, setMyGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
    loadMyGroup();
  }, [userId]);

  const loadGroups = async () => {
    const { data } = await supabase
      .from('study_groups')
      .select('*')
      .order('member_count', { ascending: false });

    setGroups(data || []);
    setLoading(false);
  };

  const loadMyGroup = async () => {
    const { data } = await supabase
      .from('study_group_members')
      .select('study_groups(*)')
      .eq('user_id', userId)
      .single();

    if (data) setMyGroup(data.study_groups as any);
  };

  const joinGroup = async (groupId: string) => {
    const { error } = await supabase.from('study_group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    });

    if (!error) {
      toast.success('Joined study group!');
      loadMyGroup();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-purple-500/30">
        <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Study Groups
        </h3>

        {myGroup ? (
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-white">{myGroup.name}</h4>
                <p className="text-sm text-gray-400">{myGroup.description}</p>
              </div>
              <Badge>
                {myGroup.member_count}/{myGroup.max_members} members
              </Badge>
            </div>
            <Button className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              Open Group Chat
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{group.name}</h4>
                    <p className="text-sm text-gray-400">{group.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        <Users className="w-3 h-3 inline mr-1" />
                        {group.member_count}/{group.max_members}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {group.level}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => joinGroup(group.id)}
                    disabled={group.member_count >= group.max_members}
                  >
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
