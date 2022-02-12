import { createContext, FC, useContext, useEffect, useState } from "react"
import { World, UntypedEntity } from "."
import { ComponentName, IEntity } from "./ecs"
import { useRerender } from "./util/useRerender"

/**
 * Create various React-specific hooks and components for your
 * Miniplex ECS instance.
 *
 * @param world An instance of a Miniplex ECS to use.
 */
export function createReactIntegration<T extends IEntity = UntypedEntity>(world: World<T>) {
  function useArchetype(...names: ComponentName<T>[]) {
    const rerender = useRerender()
    const archetype = world.createArchetype(...names)

    useEffect(() => {
      world.listeners.archetypeChanged.get(archetype)!.on(rerender)
      return () => world.listeners.archetypeChanged.get(archetype)!.off(rerender)
    }, [world])

    return world.get(archetype)
  }

  const EntityContext = createContext<T>(null!)

  const Entity: FC = ({ children }) => {
    const [entity] = useState<T>(() => ({} as T))

    useEffect(() => {
      world.addEntity(entity)
      return () => world.removeEntity(entity)
    }, [entity])

    return <EntityContext.Provider value={entity}>{children}</EntityContext.Provider>
  }

  function Component<K extends keyof T>({ name, data }: { name: K; data: T[K] }) {
    const entity = useContext(EntityContext)

    useEffect(() => {
      world.addComponent(entity, name, data)
      return () => world.removeComponent(entity, name)
    }, [entity, name, data])

    return null
  }

  return { useArchetype, Entity, Component }
}
