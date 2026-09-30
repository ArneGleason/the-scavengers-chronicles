# The Street

Area design, v0, 30 September 2026. The front of Bill's house and the street out front, built in `src/world/street.ts`. It replaces the shops and streetcar that used to run along the north edge.

## Inspiration

A quiet residential street in Toronto's west end, used for mood rather than accuracy: semis on both sides, deep front stoops, low fences and hedges, street trees, cars parked along both curbs. Nothing here is a real address, and no real street names go into the game or the repo.

## Why it exists

Bill needs a front yard and a sidewalk to feud over. He fights with his neighbours, and he regards the public sidewalk in front of his house as his property.

## Layout

North is −Z. The camera normally looks from +X+Z, so it sees the fronts of the houses across the street but only the back of Bill's own house.

| Place | Where (metres) | What's there |
|---|---|---|
| Front yard | x −11..11, z −11..−5 | Weeds as tall as a man's patience, overgrown flagstones, a bathtub planter, a rusty bike, a dry birdbath, an ARCHIVE: KEEP OFF sign. A picket fence with a gate. |
| Bill's front | the house's −Z wall | The front door, a stoop with unread newspapers, a GO AWAY mat, a mailbox, windows papered over with newsprint |
| Sidewalk | z −13..−11 | Bill's side. A NO JOGGING sign on his fence. Joggers use it anyway. |
| Road | z −19..−13 | Cars parked along both curbs. No streetcar, no lines. |
| Far sidewalk | z −21..−19 | Street trees |
| Across the street | front yards z −25..−21, houses z −33..−25 | A row of semis with porches and stoops. Kevin's is straight across from Bill's. |
| Forecourt | x 11 onwards, z −11..−5.2 | Concrete in front of the lot, the corner store and the gym |

### The camera turns round in the front yard

In the front yard the camera swings round to look from −X−Z, so the player sees Bill's front door and the weeds. When he steps out of the gate, it swings back. While it's turned round, the houses across the street are hidden, since they'd be between the camera and Bill. The stick keeps its old meaning until it's let go, so he doesn't walk straight back out of the yard when the view flips.

## The people

| Who | Where | What they do |
|---|---|---|
| **Kevin** | Across the street | Works at a media company (social media for a mattress store). Bill believes he's a media mogul and his way into writing movies. Kevin is "away" (he is not away), so Bill protects his parcels by taking them. Kevin appears at his door once his parcels are gone. |
| **The Lug Nutz** | The boxing gym ("LUG NUTZ BOXING & IRON") | Three enormous gym guys: one on the heavy bag inside, one skipping rope in the yard, one doing curls. Menacing, and relentlessly encouraging ("Looking swole, Bill!"). They laugh off insults. Bill claims he can hear them from his house, a quarter of a kilometre away; really he just disapproves of people doing things. |
| **Joggers** | Both sidewalks, in a loop | Cheerful, with earbuds. Bill shouts "PRIVATE SIDEWALK!" when they pass his house. They reply "Morning!" A toot sends them sprinting ("EW!"). They swerve round him if he stands in their way. |

## The errands here

They follow the Grate Shelf Revelation in the chain (`src/content/missions.ts`).

| Errand | Find | Deliver to | Challenge |
|---|---|---|---|
| The Noise Complaint | Type it at Bill's Legal Department (the typewriter in the front hall) | The gym door | **LEGAL DEPARTMENT!**: mash to type, mind the carriage return (DING! KA-CHUNK!). Then the **INSULT VOLLEY!**: mash to read them the complaint; they laugh and flex it off; at the end they all flex at once (HOO-RAH!), his comb-over stands up, and he lands on his backside. The complaint becomes their doormat. |
| Parcel Protection Program | Kevin's parcels, on his stoop | Bill's own front stoop | None: it's the crime. |
| The Pitch | The movie ideas, a brick of sticky notes by the fridge (which is also covered in them) | Kevin's front door | **THE PITCH!**: every mash sticks one idea on Kevin ("SOUP: THE MUSICAL", "THE GRATE ESCAPE", "DIE HARD, BUT IN A BASEMENT"); he keeps trying to close the door (SLAM-, OW!). He ends up covered: "I'll... pass it along." |

Each ends with the commemorative photo card.
