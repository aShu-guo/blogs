# Vue 3  -
>  Vue 3 Mermaid
---
##
###
| # |  |  |  |
|---|------|------|------|
| 1 | [1-1-overview.md](./1-1-overview.md) | **** |  |
| 2 | [1-2-createapp.md](./1-2-createapp.md) | **createApp() ** | App  |
| 3 | [1-2-mount.md](./1-2-mount.md) | **mount()  render** | patch  |
| 4 | [1-3-component-init.md](./1-3-component-init.md) | **** | Props/SlotsRender Proxy |
| 5 | [1-4-setup.md](./1-4-setup.md) | **setup() ** |  |
| 6 | [1-5-render-effect.md](./1-5-render-effect.md) | **** | ReactiveEffect |
| 7 | [1-6-architecture.md](./1-6-architecture.md) | **** |  |
---
##
###
```
1-1-overview.md
    ↓
1-2-createapp.md  ()
    ↓
1-2-mount.md      ()
    ↓
1-3-component-init.md ()
```
###
```
1-1-overview.md
    ↓
1-4-setup.md      ( setup )
    ↓
1-5-render-effect.md ()
    ↓
1-6-architecture.md  ()
```
###
```
1-1-overview.md
    ↓ ()
     1-2-createapp.md
     1-2-mount.md
     1-3-component-init.md
     1-4-setup.md
     1-5-render-effect.md
     1-6-architecture.md
```
---
##
### 1.  (1-1-overview.md)
****
- AppContextVNodeComponentInternalInstance
- Mermaid
-
-
-
### 2. createApp()  (1-2-createapp.md)
****
-
-  AppContext  7
- App  API usecomponentdirectiveprovidemount
-
-
### 3. mount()  render (1-2-mount.md)
** DOM  DOM**
- mount()  8
- render()
- patch()
- processComponent()
-
- SSR  vs
### 4.  (1-3-component-init.md)
**VNode  ComponentInternalInstance**
- createComponentInstance()
- setupComponent()
- initProps()  initSlots()
- setupStatefulComponent()
- createSetupContext()
- handleSetupResult()
-
### 5. setup()  (1-4-setup.md)
**Composition API **
- setup()
- props  context
-
- Promise
-
-
### 6.  (1-5-render-effect.md)
**" → "**
- setupRenderEffect()
- 7
-
- ReactiveEffect
-
-  EffectScope
-
### 7.  (1-6-architecture.md)
****
- ShapeFlags
- PatchFlags
- 7
- WeakMapaccessCache
-
-
-
-
---
##
- [ ] Vue 3
- [ ]
- [ ]
- [ ] setup()
- [ ]
- [ ]
- [ ] Vue 3
- [ ]  Vue 3
---
##
### AppContext
****: [1-2-createapp.md](./1-2-createapp.md)
### VNode
 DOM  UI
****: [1-1-overview.md](./1-1-overview.md)
### ComponentInternalInstance
****: [1-3-component-init.md](./1-3-component-init.md)
### ReactiveEffect
****: [1-5-render-effect.md](./1-5-render-effect.md)
### SetupContext
setup()  emitslotsattrsexpose
****: [1-4-setup.md](./1-4-setup.md)
### ShapeFlags
 VNode
****: [1-6-architecture.md](./1-6-architecture.md)
### PatchFlags
****: [1-6-architecture.md](./1-6-architecture.md)
---
##
### ...
****
- [1-1-overview.md](./1-1-overview.md) -
- [1-2-createapp.md](./1-2-createapp.md) -
****
- [1-3-component-init.md](./1-3-component-init.md) -
- [1-2-mount.md](./1-2-mount.md) -  mount
**setup() **
- [1-4-setup.md](./1-4-setup.md) -
- [1-3-component-init.md](./1-3-component-init.md) -
****
- [1-5-render-effect.md](./1-5-render-effect.md) -
- [1-1-overview.md](./1-1-overview.md) -
****
- [1-6-architecture.md](./1-6-architecture.md) -
- [1-1-overview.md](./1-1-overview.md) -
** DOM  patch**
- [1-2-mount.md](./1-2-mount.md) - patch
- [1-1-overview.md](./1-1-overview.md) -
****
- [1-2-createapp.md](./1-2-createapp.md) - app.use()
****
- [1-5-render-effect.md](./1-5-render-effect.md) -
---
##
```
createApp(RootComponent)
  ↓
createAppContext()  ←
  ↓
 App
  ↓
app.use/component/provide  ←
  ↓
app.mount(container)
  ↓
createVNode(RootComponent)  ←
  ↓
render(vnode, container)
  ↓
patch(null, vnode)  ←  DOM
  ↓
processComponent(vnode)  ←
  ↓
mountComponent(vnode)  ←
  ↓
createComponentInstance()  ←
  ↓
setupComponent()  ←  Props/Slots
  ↓
setupStatefulComponent()  ←  setup()
  ↓
setup(props, context)  ←
  ↓
setupRenderEffect()  ←
  ↓
renderComponentRoot()  ←  DOM
  ↓
patch(null, subTree)  ←
  ↓
```
---
##
---
##
###  1
1.  1-1-overview.md30
2.  1-2-createapp.md45
3.  1-2-mount.md45
###  2
1.  1-3-component-init.md1
2.  1-4-setup.md45
3.
###  3
1.  1-5-render-effect.md1
2.  1-6-architecture.md1
3.
###
-  Vue 3
-  Vue DevTools
-
-
---
##
**Q: **
A:  1-1-overview.md
**Q: **
A:
**Q: **
A:
**Q: **
A:
---
##
---
****
