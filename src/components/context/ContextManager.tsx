
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit3, Eye, EyeOff, User } from 'lucide-react';

interface Context {
  id: string;
  name: string;
  context: string;
}

const ContextManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isAddingContext, setIsAddingContext] = useState(false);
  const [newContextName, setNewContextName] = useState('');
  const [newContextContent, setNewContextContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedContexts, setExpandedContexts] = useState<Set<string>>(new Set());
  const [editingContext, setEditingContext] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (user) {
      loadContexts();
    }
  }, [user]);

  const loadContexts = async () => {
    try {
      const { data, error } = await supabase
        .from('contexts')
        .select('id, name, context')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setContexts(data || []);
    } catch (error) {
      console.error('Error loading contexts:', error);
      toast({
        title: "Error",
        description: "Failed to load contexts",
        variant: "destructive"
      });
    }
  };

  const saveContext = async () => {
    if (!newContextName.trim() || !newContextContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both name and context",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contexts')
        .insert({
          user_id: user?.id,
          name: newContextName.trim(),
          context: newContextContent.trim()
        })
        .select('id, name, context')
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setContexts([data, ...contexts]);
      }
      setNewContextName('');
      setNewContextContent('');
      setIsAddingContext(false);
      
      toast({
        title: "Success",
        description: "Context saved successfully"
      });
    } catch (error) {
      console.error('Error saving context:', error);
      toast({
        title: "Error",
        description: "Failed to save context",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateContext = async () => {
    if (!editName.trim() || !editContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both name and context",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('contexts')
        .update({
          name: editName.trim(),
          context: editContent.trim()
        })
        .eq('id', editingContext);

      if (error) {
        throw error;
      }

      setContexts(contexts.map(c => 
        c.id === editingContext 
          ? { ...c, name: editName.trim(), context: editContent.trim() }
          : c
      ));
      
      setEditingContext(null);
      setEditName('');
      setEditContent('');
      
      toast({
        title: "Success",
        description: "Context updated successfully"
      });
    } catch (error) {
      console.error('Error updating context:', error);
      toast({
        title: "Error",
        description: "Failed to update context",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContext = async (contextId: string) => {
    try {
      const { error } = await supabase
        .from('contexts')
        .delete()
        .eq('id', contextId);

      if (error) {
        throw error;
      }

      setContexts(contexts.filter(c => c.id !== contextId));
      
      toast({
        title: "Success",
        description: "Context deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting context:', error);
      toast({
        title: "Error",
        description: "Failed to delete context",
        variant: "destructive"
      });
    }
  };

  const toggleExpanded = (contextId: string) => {
    const newExpanded = new Set(expandedContexts);
    if (newExpanded.has(contextId)) {
      newExpanded.delete(contextId);
    } else {
      newExpanded.add(contextId);
    }
    setExpandedContexts(newExpanded);
  };

  const startEditing = (context: Context) => {
    setEditingContext(context.id);
    setEditName(context.name);
    setEditContent(context.context);
  };

  const cancelEditing = () => {
    setEditingContext(null);
    setEditName('');
    setEditContent('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personality Library
        </CardTitle>
        <CardDescription>
          Create and manage personality profiles that will be available across all your signals for better comment generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {contexts.length > 0 && (
          <div className="space-y-3">
            {contexts.map((context) => (
              <div key={context.id} className="border rounded-lg p-4">
                {editingContext === context.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Personality Name</label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g., John, Sarah, Marketing Expert"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Personality Description</label>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Describe this personality's traits, background, and how they communicate..."
                        rows={6}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={updateContext} disabled={isLoading} size="sm">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={cancelEditing} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">{context.name}</Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(context.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {expandedContexts.has(context.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(context)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteContext(context.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {expandedContexts.has(context.id) ? (
                        <div className="whitespace-pre-wrap">{context.context}</div>
                      ) : (
                        <div className="line-clamp-2">{context.context}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isAddingContext ? (
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <div>
              <label className="text-sm font-medium">Personality Name</label>
              <Input
                value={newContextName}
                onChange={(e) => setNewContextName(e.target.value)}
                placeholder="e.g., John, Sarah, Marketing Expert, etc."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Personality Description</label>
              <Textarea
                value={newContextContent}
                onChange={(e) => setNewContextContent(e.target.value)}
                placeholder="Describe this personality's traits, background, communication style, and how they should respond to comments..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveContext} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Personality'}
              </Button>
              <Button variant="outline" onClick={() => setIsAddingContext(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setIsAddingContext(true)} 
            variant="outline" 
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Personality
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ContextManager;
