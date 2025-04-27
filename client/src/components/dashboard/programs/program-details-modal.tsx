"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusIcon, MoreVerticalIcon, PencilIcon, TrashIcon, InfoIcon } from "lucide-react"

export function ProgramDetailsModal({
  open,
  onOpenChange,
  program,
  modules,
  topics,
  selectedModuleId,
  isAdmin,
  onAddModule,
  onEditModule,
  onDeleteModule,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onSelectModule,
  fetchTopicsByModule,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Program Details</DialogTitle>
        </DialogHeader>

        {program && (
          <div className="mt-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{program.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {program.offering?.name} - <Badge variant="outline">{program.offering?.type}</Badge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">${program.price.toFixed(2)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{program.estimatedDuration} hours</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</h4>
              <p>{program.description}</p>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Modules</h4>
                {isAdmin && (
                  <Button onClick={onAddModule} size="sm" variant="outline" className="flex items-center gap-1">
                    <PlusIcon className="h-3 w-3" />
                    Add Module
                  </Button>
                )}
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {modules.length > 0 ? (
                  modules.map((module) => (
                    <div key={module._id} className="bg-slate-50 dark:bg-slate-800 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{module.name}</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{module.description}</p>
                          <p className="text-xs text-slate-500 mt-1">Duration: {module.estimatedDuration} hours</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{module.topics?.length || 0} Topics</Badge>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVerticalIcon className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditModule(module)}>
                                  <PencilIcon className="h-4 w-4 mr-2" />
                                  Edit Module
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteModule(module)}>
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  Delete Module
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAddTopic(module._id)}>
                                  <PlusIcon className="h-4 w-4 mr-2" />
                                  Add Topic
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    fetchTopicsByModule(module._id)
                                    onSelectModule(module._id)
                                  }}
                                >
                                  <InfoIcon className="h-4 w-4 mr-2" />
                                  View Topics
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs py-0 h-6 mb-1"
                          onClick={() => onSelectModule(module._id)}
                        >
                          {selectedModuleId === module._id ? "Hide Topics" : "Show Topics"}
                        </Button>

                        {selectedModuleId === module._id && (
                          <div className="pl-4 space-y-2 mt-2 border-l-2 border-slate-200 dark:border-slate-700">
                            {topics.length > 0 ? (
                              topics.map((topic) => (
                                <div key={topic._id} className="bg-slate-100 dark:bg-slate-700 rounded-md p-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h6 className="font-medium text-sm">{topic.name}</h6>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        {topic.description}
                                      </p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        Duration: {topic.estimatedDuration} hours
                                      </p>
                                    </div>
                                    {isAdmin && (
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => onEditTopic(topic)}>
                                          <PencilIcon className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => onDeleteTopic(topic)}>
                                          <TrashIcon className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-slate-500 p-2">No topics available for this module</div>
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs mt-1"
                                onClick={() => onAddTopic(module._id)}
                              >
                                <PlusIcon className="h-3 w-3 mr-1" />
                                Add Topic
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-slate-500">
                    <p>No modules available</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
