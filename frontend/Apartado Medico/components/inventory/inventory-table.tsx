"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Lot {
  id_LoteVacuna: number
  NumeroLote: string
  NombreVacuna: string
  NombreFabricante: string
  FechaCaducidad: string
  FechaRecepcion: string
  CantidadInicial: number
  CantidadDisponible: number
  Activo: boolean
}

interface InventoryTableProps {
  lots: Lot[]
  loading: boolean
}

export function InventoryTable({ lots, loading }: InventoryTableProps) {
  if (loading) {
    return <p>Cargando inventario...</p>
  }

  if (lots.length === 0) {
    return <p>No se encontraron lotes para este centro de vacunación.</p>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES")
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número de Lote</TableHead>
          <TableHead>Vacuna</TableHead>
          <TableHead>Fabricante</TableHead>
          <TableHead>Cant. Disponible</TableHead>
          <TableHead>Fecha de Caducidad</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map((lot) => (
          <TableRow key={lot.id_LoteVacuna}>
            <TableCell className="font-medium">{lot.NumeroLote}</TableCell>
            <TableCell>{lot.NombreVacuna}</TableCell>
            <TableCell>{lot.NombreFabricante}</TableCell>
            <TableCell>
              {lot.CantidadDisponible} / {lot.CantidadInicial}
            </TableCell>
            <TableCell>{formatDate(lot.FechaCaducidad)}</TableCell>
            <TableCell>
              <Badge variant={lot.Activo ? "default" : "destructive"}>{lot.Activo ? "Activo" : "Inactivo"}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
