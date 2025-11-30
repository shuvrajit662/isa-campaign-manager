import React, { useState } from 'react';
import { User, Shield, Check, Search, MoreHorizontal, UserPlus } from 'lucide-react';
import { MOCK_USERS, MOCK_CAMPAIGNS } from '../../services/mockData';
import { User as UserType } from '../../types';
import { Button, Input, Badge, Modal, cn } from '../../components/UI';

export const AdminConsole = () => {
  const [users, setUsers] = useState<UserType[]>(MOCK_USERS);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock campaign selection for the modal
  const toggleCampaign = (campaignId: string) => {
    if (!editingUser) return;
    const current = new Set(editingUser.assignedCampaigns);
    if (current.has(campaignId)) {
      current.delete(campaignId);
    } else {
      current.add(campaignId);
    }
    setEditingUser({ ...editingUser, assignedCampaigns: Array.from(current) });
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Console</h1>
            <p className="text-slate-500 mt-2">Manage team access and campaign assignments.</p>
          </div>
          <Button>
            <UserPlus size={18} className="mr-2" /> Invite User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-500 font-medium">Total Users</p>
               <h3 className="text-3xl font-bold text-slate-900 mt-1">{users.length}</h3>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
               <User size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-500 font-medium">Active Campaigns</p>
               <h3 className="text-3xl font-bold text-slate-900 mt-1">{MOCK_CAMPAIGNS.filter(c => c.status === 'active').length}</h3>
            </div>
             <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
               <Check size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm text-slate-500 font-medium">Admins</p>
               <h3 className="text-3xl font-bold text-slate-900 mt-1">{users.filter(u => u.role === 'admin').length}</h3>
            </div>
             <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
               <Shield size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Team Members</h3>
            <div className="relative w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <Input 
                 className="pl-9 h-9 text-sm" 
                 placeholder="Search users..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
          </div>
          
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Campaigns</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <Badge 
                        variant={user.role === 'admin' ? 'default' : user.role === 'editor' ? 'secondary' : 'outline'}
                        className="uppercase"
                     >
                        {user.role}
                     </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.assignedCampaigns.length === 0 ? (
                        <span className="text-slate-400 italic">No assignments</span>
                      ) : (
                        user.assignedCampaigns.map(cid => {
                           const camp = MOCK_CAMPAIGNS.find(c => c.id === cid);
                           return camp ? <span key={cid} className="inline-block px-2 py-1 bg-slate-100 rounded text-xs text-slate-700 border border-slate-200">{camp.name}</span> : null;
                        })
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                       <MoreHorizontal size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User Access"
        footer={
           <div className="flex justify-end space-x-2">
             <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
             <Button onClick={handleSaveUser}>Save Changes</Button>
           </div>
        }
      >
        {editingUser && (
           <div className="space-y-6">
              <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Role</p>
                 <div className="flex space-x-4">
                    {['admin', 'editor', 'viewer'].map(role => (
                       <button
                          key={role}
                          onClick={() => setEditingUser({...editingUser, role: role as any})}
                          className={cn(
                             "flex-1 py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-all",
                             editingUser.role === role ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "border-slate-200 hover:border-slate-300"
                          )}
                       >
                          {role}
                       </button>
                    ))}
                 </div>
              </div>
              
              <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Campaign Access</p>
                 <div className="space-y-2 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {MOCK_CAMPAIGNS.map(campaign => (
                       <div 
                          key={campaign.id} 
                          className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer"
                          onClick={() => toggleCampaign(campaign.id)}
                       >
                          <span className="text-sm font-medium text-slate-700">{campaign.name}</span>
                          {editingUser.assignedCampaigns.includes(campaign.id) && (
                             <Check size={16} className="text-indigo-600" />
                          )}
                       </div>
                    ))}
                 </div>
                 <p className="text-xs text-slate-400 mt-2">Click to toggle access.</p>
              </div>
           </div>
        )}
      </Modal>
    </div>
  );
};
