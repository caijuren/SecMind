"use client"

import { useState, useMemo } from "react"
import {
  Search,
  FileText,
  Download,
  User,
  Settings,
  Database,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageHeader } from "@/components/layout/page-header"
import { useLocaleStore } from "@/store/locale-store"

type OperationType = "登录" | "查询" | "修改" | "删除" | "导出"
type OperationResult = "成功" | "失败"
type FilterCategory = "all" | "user_action" | "system_change" | "data_access"

interface AuditLog {
  id: string
  time: string
  operator: string
  operatorAvatar: string
  operationType: OperationType
  category: "user_action" | "system_change" | "data_access"
  target: string
  detail: string
  ip: string
  result: OperationResult
}

const CATEGORY_CONFIG: Record<string, { label: string; count: number; color: string; icon: typeof User }> = {
  user_action: { label: "用户操作", count: 1247, color: "#06b6d4", icon: User },
  system_change: { label: "系统变更", count: 389, color: "#a855f7", icon: Settings },
  data_access: { label: "数据访问", count: 2156, color: "#22c55e", icon: Database },
}

const TYPE_COLORS: Record<OperationType, string> = {
  登录: "#06b6d4",
  查询: "#3b82f6",
  修改: "#f59e0b",
  删除: "#ef4444",
  导出: "#8b5cf6",
}

const mockLogs: AuditLog[] = [
  { id: "LOG-001", time: "2026-05-10 14:32:18", operator: "张伟", operatorAvatar: "张", operationType: "登录", category: "user_action", target: "VPN网关", detail: "通过VPN从103.45.67.89异地登录", ip: "103.45.67.89", result: "成功" },
  { id: "LOG-002", time: "2026-05-10 14:28:05", operator: "系统", operatorAvatar: "系", operationType: "修改", category: "system_change", target: "防火墙策略", detail: "自动更新威胁情报IP黑名单，新增127条规则", ip: "10.0.1.1", result: "成功" },
  { id: "LOG-003", time: "2026-05-10 14:25:42", operator: "刘明", operatorAvatar: "刘", operationType: "查询", category: "data_access", target: "财务数据库", detail: "查询Q1季度财务报表数据", ip: "10.0.2.88", result: "成功" },
  { id: "LOG-004", time: "2026-05-10 14:20:33", operator: "王芳", operatorAvatar: "王", operationType: "导出", category: "data_access", target: "员工信息表", detail: "导出全员通讯录至Excel文件", ip: "10.0.3.15", result: "成功" },
  { id: "LOG-005", time: "2026-05-10 14:15:11", operator: "陈鹏", operatorAvatar: "陈", operationType: "删除", category: "user_action", target: "日志归档", detail: "清理90天前的系统日志归档", ip: "10.0.1.22", result: "失败" },
  { id: "LOG-006", time: "2026-05-10 14:10:27", operator: "系统", operatorAvatar: "系", operationType: "修改", category: "system_change", target: "IAM策略", detail: "服务账号app-service提权至Administrators组", ip: "10.0.2.50", result: "成功" },
  { id: "LOG-007", time: "2026-05-10 14:05:59", operator: "赵雪", operatorAvatar: "赵", operationType: "查询", category: "data_access", target: "客户数据库", detail: "查询VIP客户交易记录", ip: "10.0.4.33", result: "成功" },
  { id: "LOG-008", time: "2026-05-10 13:58:14", operator: "林峰", operatorAvatar: "林", operationType: "登录", category: "user_action", target: "OA系统", detail: "从3个不同城市设备同时在线", ip: "10.0.5.12", result: "成功" },
  { id: "LOG-009", time: "2026-05-10 13:52:38", operator: "系统", operatorAvatar: "系", operationType: "修改", category: "system_change", target: "EDR策略", detail: "更新恶意软件签名库至v2026.05.10", ip: "10.0.1.1", result: "成功" },
  { id: "LOG-010", time: "2026-05-10 13:45:22", operator: "周磊", operatorAvatar: "周", operationType: "导出", category: "data_access", target: "源代码仓库", detail: "克隆核心服务源码至本地", ip: "10.0.2.88", result: "成功" },
  { id: "LOG-011", time: "2026-05-10 13:40:16", operator: "张伟", operatorAvatar: "张", operationType: "修改", category: "user_action", target: "安全策略", detail: "修改VPN双因素认证配置", ip: "10.0.1.100", result: "成功" },
  { id: "LOG-012", time: "2026-05-10 13:35:44", operator: "吴婷", operatorAvatar: "吴", operationType: "删除", category: "data_access", target: "临时文件", detail: "删除共享盘临时数据文件", ip: "10.0.6.18", result: "成功" },
  { id: "LOG-013", time: "2026-05-10 13:30:08", operator: "系统", operatorAvatar: "系", operationType: "修改", category: "system_change", target: "DNS配置", detail: "自动更新内部DNS解析记录", ip: "10.0.1.1", result: "成功" },
  { id: "LOG-014", time: "2026-05-10 13:22:55", operator: "刘明", operatorAvatar: "刘", operationType: "查询", category: "data_access", target: "审计日志", detail: "查询近7天管理员操作记录", ip: "10.0.2.88", result: "成功" },
  { id: "LOG-015", time: "2026-05-10 13:18:30", operator: "陈鹏", operatorAvatar: "陈", operationType: "登录", category: "user_action", target: "服务器管理台", detail: "SSH登录生产服务器ADM-SRV01", ip: "10.0.1.22", result: "失败" },
  { id: "LOG-016", time: "2026-05-10 13:12:47", operator: "王芳", operatorAvatar: "王", operationType: "修改", category: "user_action", target: "用户权限", detail: "将dev.zhou添加至安全审计员组", ip: "10.0.3.15", result: "成功" },
  { id: "LOG-017", time: "2026-05-10 13:05:33", operator: "系统", operatorAvatar: "系", operationType: "删除", category: "system_change", target: "过期证书", detail: "自动清理30天前过期的TLS证书", ip: "10.0.1.1", result: "成功" },
  { id: "LOG-018", time: "2026-05-10 12:58:19", operator: "赵雪", operatorAvatar: "赵", operationType: "导出", category: "data_access", target: "安全报告", detail: "导出月度安全态势分析报告PDF", ip: "10.0.4.33", result: "成功" },
  { id: "LOG-019", time: "2026-05-10 12:50:02", operator: "林峰", operatorAvatar: "林", operationType: "查询", category: "data_access", target: "邮件网关", detail: "查询被隔离的钓鱼邮件列表", ip: "10.0.5.12", result: "失败" },
  { id: "LOG-020", time: "2026-05-10 12:42:38", operator: "周磊", operatorAvatar: "周", operationType: "登录", category: "user_action", target: "云管理控制台", detail: "登录AWS管理控制台查看资源", ip: "10.0.2.88", result: "成功" },
  { id: "LOG-021", time: "2026-05-10 12:35:15", operator: "系统", operatorAvatar: "系", operationType: "修改", category: "system_change", target: "WAF规则", detail: "同步OWASP Top10防护规则集更新", ip: "10.0.1.1", result: "成功" },
  { id: "LOG-022", time: "2026-05-10 12:28:44", operator: "吴婷", operatorAvatar: "吴", operationType: "查询", category: "data_access", target: "漏洞扫描报告", detail: "查询最新漏洞扫描结果", ip: "10.0.6.18", result: "成功" },
]

export default function AuditPage() {
  const { t } = useLocaleStore()
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [operatorFilter, setOperatorFilter] = useState("")
  const [timeFilter, setTimeFilter] = useState<string>("7d")

  const filteredLogs = useMemo(() => {
    return mockLogs.filter((log) => {
      if (activeCategory !== "all" && log.category !== activeCategory) return false
      if (typeFilter !== "all" && log.operationType !== typeFilter) return false
      if (operatorFilter && !log.operator.includes(operatorFilter)) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match =
          log.operator.toLowerCase().includes(q) ||
          log.target.toLowerCase().includes(q) ||
          log.detail.toLowerCase().includes(q) ||
          log.ip.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [activeCategory, typeFilter, operatorFilter, searchQuery])

  const categoryCards = Object.entries(CATEGORY_CONFIG) as [string, { label: string; count: number; color: string; icon: typeof User }][]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={FileText}
        title="审计日志"
      />

      <div className="grid grid-cols-3 gap-4">
        {categoryCards.map(([key, config]) => {
          const Icon = config.icon
          const isActive = activeCategory === key
          return (
            <Card
              key={key}
              className={cn(
                "cursor-pointer transition-all overflow-hidden",
                isActive && "ring-1"
              )}
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${config.color}15, ${config.color}08)`
                  : "rgba(255,255,255,0.03)",
                borderColor: isActive ? `${config.color}40` : "rgba(255,255,255,0.06)",
                boxShadow: isActive
                  ? `0 0 20px ${config.color}15, inset 0 0 20px ${config.color}05`
                  : undefined,
              }}
              onClick={() => setActiveCategory(isActive ? "all" : key as FilterCategory)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg border"
                      style={{
                        backgroundColor: `${config.color}15`,
                        borderColor: `${config.color}30`,
                      }}
                    >
                      <Icon className="h-4.5 w-4.5" style={{ color: config.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/70">{config.label}</p>
                      <p
                        className="text-xl font-bold font-mono"
                        style={{
                          color: isActive ? config.color : "rgba(255,255,255,0.9)",
                          textShadow: isActive ? `0 0 12px ${config.color}50` : undefined,
                        }}
                      >
                        {config.count.toLocaleString()}
                        <span className="text-xs font-normal text-white/30 ml-1">条</span>
                      </p>
                    </div>
                  </div>
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle, ${config.color}20, transparent)`,
                    }}
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: config.color,
                        boxShadow: `0 0 8px ${config.color}80`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索操作人、对象、详情、IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-white/5 border-cyan-500/15 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
            />
          </div>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
            <SelectTrigger className="h-8 w-[130px] border-cyan-500/15 bg-white/5 text-foreground">
              <Filter className="h-3.5 w-3.5 mr-1 text-white/40" />
              <SelectValue placeholder="操作类型" />
            </SelectTrigger>
            <SelectContent className="border-cyan-500/15 bg-[#0c1a3a] text-foreground">
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="登录">登录</SelectItem>
              <SelectItem value="查询">查询</SelectItem>
              <SelectItem value="修改">修改</SelectItem>
              <SelectItem value="删除">删除</SelectItem>
              <SelectItem value="导出">导出</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="操作人"
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="h-8 w-[120px] bg-white/5 border-cyan-500/15 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-cyan-500/40 focus-visible:ring-cyan-500/20"
          />

          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v ?? "7d")}>
            <SelectTrigger className="h-8 w-[120px] border-cyan-500/15 bg-white/5 text-foreground">
              <Clock className="h-3.5 w-3.5 mr-1 text-white/40" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-cyan-500/15 bg-[#0c1a3a] text-foreground">
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="7d">近7天</SelectItem>
              <SelectItem value="30d">近30天</SelectItem>
              <SelectItem value="90d">近90天</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card
        className="overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.02)",
          borderColor: "rgba(34,211,238,0.1)",
          boxShadow: "0 0 16px rgba(34,211,238,0.04)",
        }}
      >
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-cyan-500/10 hover:bg-transparent">
                <TableHead className="text-white/40 text-xs font-semibold tracking-wider h-9">时间</TableHead>
                <TableHead className="text-white/40 text-xs font-semibold tracking-wider h-9">操作人</TableHead>
                <TableHead className="text-white/40 text-xs font-semibold tracking-wider h-9">操作类型</TableHead>
                <TableHead className="text-white/40 text-xs font-semibold tracking-wider h-9">操作对象</TableHead>
                <TableHead className="text-white/40 text-xs font-semibold tracking-wider h-9">操作详情</TableHead>
                <TableHead className="text-white/40 text-xs font-semibold tracking-wider h-9">IP地址</TableHead>
                <TableHead className="text-white/40 text-xs font-semibold tracking-wider h-9">结果</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const typeColor = TYPE_COLORS[log.operationType]
                const isSystem = log.operator === "系统"
                return (
                  <TableRow
                    key={log.id}
                    className="border-b border-white/[0.04] hover:bg-cyan-500/[0.04] transition-colors"
                  >
                    <TableCell className="text-xs font-mono text-white/50 py-2.5">{log.time}</TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarFallback
                            className="text-[10px] font-bold"
                            style={{
                              backgroundColor: isSystem ? "#a855f720" : "#06b6d420",
                              color: isSystem ? "#a855f7" : "#06b6d4",
                            }}
                          >
                            {log.operatorAvatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn("text-xs font-medium", isSystem ? "text-purple-400" : "text-white/80")}>
                          {log.operator}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold gap-1 rounded-md"
                        style={{
                          backgroundColor: `${typeColor}12`,
                          color: typeColor,
                          borderColor: `${typeColor}30`,
                        }}
                      >
                        {log.operationType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-white/70 font-medium py-2.5">{log.target}</TableCell>
                    <TableCell className="text-xs text-white/50 max-w-[280px] truncate py-2.5">{log.detail}</TableCell>
                    <TableCell className="text-xs font-mono text-white/40 py-2.5">{log.ip}</TableCell>
                    <TableCell className="py-2.5">
                      {log.result === "成功" ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold gap-1 rounded-md"
                          style={{
                            backgroundColor: "#22c55e12",
                            color: "#22c55e",
                            borderColor: "#22c55e30",
                          }}
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          成功
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold gap-1 rounded-md"
                          style={{
                            backgroundColor: "#ef444412",
                            color: "#ef4444",
                            borderColor: "#ef444430",
                          }}
                        >
                          <XCircle className="h-2.5 w-2.5" />
                          失败
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-white/30">
                    暂无匹配的审计日志
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/30">
          共 {filteredLogs.length} 条记录
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/30 gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            导出CSV
          </Button>
          <Button
            variant="outline"
            className="border-purple-500/20 bg-purple-500/[0.06] text-purple-400 hover:bg-purple-500/15 hover:border-purple-500/30 gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            导出PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
