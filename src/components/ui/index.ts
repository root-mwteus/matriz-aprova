/**
 * Sistema de componentes da aplicação.
 *
 * Ponto de entrada único: `import { Button, Panel } from "@/components/ui"`.
 * Componente novo entra aqui; variação de estilo entra como prop, não
 * como classe solta na tela.
 */

export { Button, IconButton, type ButtonProps } from "./Button"
export { Field, Input, SearchInput, Textarea, Select, Checkbox } from "./Field"
export { Panel, PanelHeader, PanelBody, PanelFooter, Section, Separator } from "./Panel"
export { Badge, StatusBadge, Kbd } from "./Badge"
export { Skeleton, SkeletonText, Spinner, EmptyState, ErrorState } from "./Feedback"
export { Stat, Delta, Progress, ProgressRing, Avatar } from "./Stat"
export { Modal, ConfirmModal } from "./Modal"
export { Menu, MenuItem, MenuLabel, MenuSeparator } from "./Menu"
export { Tooltip } from "./Tooltip"
export { Tabs, Segmented, type TabItem } from "./Tabs"
export { DataTable, Pagination, type Column } from "./Table"
export { Toolbar, FilterSelect } from "./Toolbar"
