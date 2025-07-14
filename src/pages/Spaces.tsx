import { useState } from 'react';
import { useSpaces } from '@/hooks/useSpaces';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Spaces() {
  const { user } = useAuthContext();
  const { spaces, isLoading, error, createSpace, updateSpace, deleteSpace } = useSpaces();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<any>(null);
  const [newSpace, setNewSpace] = useState({
    name: '',
    description: '',
    type: 'residential',
    status: 'active'
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando espaços...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const handleCreateSpace = async () => {
    try {
      await createSpace(newSpace);
      setIsCreateModalOpen(false);
      setNewSpace({ name: '', description: '', type: 'residential', status: 'active' });
    } catch (error) {
      console.error('Erro ao criar espaço:', error);
    }
  };

  const handleUpdateSpace = async (space: any) => {
    try {
      await updateSpace(space.id, space);
      setEditingSpace(null);
    } catch (error) {
      console.error('Erro ao atualizar espaço:', error);
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este espaço?')) {
      try {
        await deleteSpace(spaceId);
      } catch (error) {
        console.error('Erro ao excluir espaço:', error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Espaços</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Novo Espaço
        </button>
      </div>

      {/* Lista de Espaços */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {spaces.map((space: any) => (
              <tr key={space.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {space.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {space.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {space.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    space.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {space.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setEditingSpace(space)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteSpace(space.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Novo Espaço</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome do espaço"
                value={newSpace.name}
                onChange={(e) => setNewSpace({...newSpace, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <textarea
                placeholder="Descrição"
                value={newSpace.description}
                onChange={(e) => setNewSpace({...newSpace, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
              <select
                value={newSpace.type}
                onChange={(e) => setNewSpace({...newSpace, type: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="residential">Residencial</option>
                <option value="commercial">Comercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSpace}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingSpace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Editar Espaço</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome do espaço"
                value={editingSpace.name || ''}
                onChange={(e) => setEditingSpace({...editingSpace, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <textarea
                placeholder="Descrição"
                value={editingSpace.description || ''}
                onChange={(e) => setEditingSpace({...editingSpace, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
              <select
                value={editingSpace.type || 'residential'}
                onChange={(e) => setEditingSpace({...editingSpace, type: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="residential">Residencial</option>
                <option value="commercial">Comercial</option>
                <option value="industrial">Industrial</option>
              </select>
              <select
                value={editingSpace.status || 'active'}
                onChange={(e) => setEditingSpace({...editingSpace, status: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setEditingSpace(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateSpace(editingSpace)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 