"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddAdminUserForm } from "@/components/admin/add-admin-user-form"
import useApi from "@/hooks/use-api"

interface User {
  id_Usuario: number
  Cedula_Usuario: string
  Email: string
  NombreRol: string
  Estado: string
}

export default function UsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data: users, loading: isLoading, error, request: fetchUsers } = useApi<User[]>()

  useEffect(() => {
    fetchUsers("/api/users")
  }, [fetchUsers])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa los detalles para agregar un nuevo usuario al sistema. Este formulario utiliza el nuevo flujo de creación segura.
              </DialogDescription>
            </DialogHeader>
            <AddAdminUserForm onSuccess={() => {
              setIsDialogOpen(false);
              fetchUsers("/api/users");
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p>Loading users...</p>}
      {error && <p className="text-red-500">Failed to load users: {error}</p>}

      {users && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id_Usuario} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{user.id_Usuario}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{user.Email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{user.NombreRol}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.Estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {user.Estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
