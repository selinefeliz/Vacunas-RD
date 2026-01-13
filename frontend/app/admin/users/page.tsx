"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AddAdminUserForm } from "@/components/admin/add-admin-user-form"
import { EditAdminUserForm } from "@/components/admin/edit-admin-user-form"
import useApi from "@/hooks/use-api"
import { Edit, Trash2, UserPlus, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id_Usuario: number
  Cedula_Usuario: string
  Email: string
  NombreRol: string
  Estado: string
  Nombre?: string
  Apellido?: string
}

export default function UsersPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingResult, setEditingResult] = useState<number | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const { data: users, loading: isLoading, error, request: fetchUsers } = useApi<User[]>()
  const { request: deleteUserReq } = useApi()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers("/api/users")
  }, [fetchUsers])

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    try {
      await deleteUserReq(`/api/users/${deletingUser.id_Usuario}`, { method: 'DELETE' })
      toast({
        title: "Usuario eliminado",
        description: `El usuario ${deletingUser.Email} ha sido desactivado/eliminado.`
      })
      fetchUsers("/api/users")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el usuario."
      })
    } finally {
      setDeletingUser(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios, roles y permisos del sistema.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa los detalles para agregar un nuevo usuario al sistema.
              </DialogDescription>
            </DialogHeader>
            <AddAdminUserForm onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchUsers("/api/users");
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>Lista de todos los usuarios registrados y su estado actual.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="p-4 text-center">Cargando usuarios...</div>}
          {error && <div className="p-4 text-center text-red-500">Error: {error}</div>}

          {!isLoading && users && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr key={user.id_Usuario} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {user.Nombre && user.Apellido ? `${user.Nombre} ${user.Apellido}` : user.Email}
                          </span>
                          {(user.Nombre || user.Apellido) && (
                            <span className="text-xs text-gray-500">{user.Email}</span>
                          )}
                          <span className="text-xs text-gray-400">{user.Cedula_Usuario}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 font-medium">{user.NombreRol}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Badge className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-none ${(user.Estado === 'Activo' || user.Estado === 'Active' || String(user.Estado).trim().toLowerCase() === 'activo')
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 border-transparent'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 border-transparent'
                          }`}>
                          {user.Estado}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingResult(user.id_Usuario)} title="Editar">
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingUser(user)} title="Eliminar">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingResult} onOpenChange={(open) => !open && setEditingResult(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los datos del usuario seleccionado.</DialogDescription>
          </DialogHeader>
          {editingResult && (
            <EditAdminUserForm
              userId={editingResult}
              onSuccess={() => {
                setEditingResult(null)
                fetchUsers("/api/users")
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al usuario <strong>{deletingUser?.Email}</strong>.
              El usuario perderá acceso al sistema inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
