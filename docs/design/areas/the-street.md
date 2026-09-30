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

### The camera faces the entrances on his side of the street

On Bill's side of the street (his front yard, the sidewalk and forecourt, and the near half of the road, anywhere along the street) the camera swings round to look from −X−Z. That shows the fronts of his house, the corner store and the gym. Once he crosses the middle of the road, it swings back to look at the houses opposite. While it's turned round, the houses across the street are hidden, since they'd be between the camera and Bill.

The swing is disorienting, so Bill is disoriented too. When the camera turns round he either teeters on the spot (WHOA-OA-OA!) or falls flat on his face (SPLAT!), and then explains it: the Earth is at a peculiar point in its orbit and his vagus nerve felt it first; he turned his head too quickly scanning for bylaw infractions; he's low on soup (said more often when the toots are empty); the gym noise has built up in his inner ear (near the gym); magnetic north moved. The stumble stops him for about a second and a half, long enough for the player to get their bearings, and afterwards the stick follows the new view. He does it at most once every ten seconds. If he's busy (a challenge, the skateboard, a photo) or it's too soon, the stick keeps its old meaning until it's let go instead, so the flip never turns him round mid-stride.

The corner store, the gym and the junkyard's north fence have street-side signs for the turned-round view.

## The people

| Who | Where | What they do |
|---|---|---|
| **Kevin** | Across the street | Works at a media company (social media for a mattress store). Bill believes he's a media mogul and his way into writing movies. Kevin is "away" (he is not away), so Bill protects his parcels by taking them. Kevin appears at his door once his parcels are gone. |
| **The Lug Nutz** | The boxing gym ("LUG NUTZ BOXING & IRON") | Three enormous gym guys: one on the heavy bag inside, one skipping rope in the yard, one doing curls. Menacing, and relentlessly encouraging ("Looking swole, Bill!"). They laugh off insults. Bill claims he can hear them from his house, a quarter of a kilometre away; really he just disapproves of people doing things. |
| **His former students** | In front of the corner store | Bill was a teacher. Four of them loiter by the store, each with an insult of their own: **Mina**, practical, with a notebook ("You've done more forewords than afterwards."); **Jules**, who treats his habits as a curriculum ("Is vinegar still worth half the grade?"); **Dev**, by a little speaker ("New song, sir? The other note?"); and **Tess**, on a crate ("You've archived another bin."). He keeps trying to get them to thank him for his life lessons: cleaning a classroom with white vinegar, and naming prog rock albums in order. E starts **LIFE LESSONS!**: mash to lecture while they groan in waves, until one of them admits the vinegar thing works. The first time, there's a class photo. |
| **Joggers** | Both sidewalks, in a loop | Cheerful, with earbuds. Bill shouts "PRIVATE SIDEWALK!" when they pass his house. They reply "Morning!" A toot sends them sprinting ("EW!"). They swerve round him if he stands in their way. |

## The errands here

They follow the Grate Shelf Revelation in the chain (`src/content/missions.ts`). The story behind the later ones is in [../story.md](../story.md).

| Errand | Find | Deliver to | Challenge |
|---|---|---|---|
| The Noise Complaint | Type it at Bill's Legal Department (the typewriter in the front hall) | The gym door | **LEGAL DEPARTMENT!**: mash to type, mind the carriage return (DING! KA-CHUNK!). Then the **INSULT VOLLEY!**: mash to read them the complaint; they laugh and flex it off; at the end they all flex at once (HOO-RAH!), his comb-over stands up, and he lands on his backside. The complaint becomes their doormat. |
| Parcel Protection Program | Kevin's parcels, on his stoop | Bill's own front stoop | None: it's the crime. |
| The Pitch | The movie ideas, a brick of sticky notes by the fridge (which is also covered in them) | Kevin's front door | **THE PITCH!**: every mash sticks one idea on Kevin ("SOUP: THE MUSICAL", "THE GRATE ESCAPE", "DIE HARD, BUT IN A BASEMENT"); he keeps trying to close the door (SLAM-, OW!). He ends up covered: "I'll... pass it along." |
| The Vinegar Reserve | The reserve jug, on the corner-store counter | The crooked RESERVE shelf in the kitchen | **RESERVE TRANSFER!**: pour through an oversized funnel, which ends up on his head. "Containment achieved." |
| The Cheesecloth Retrospective | Cheesecloth snagged on Gary's dumpster | The empty frame in the living room | **CURATE!**: stretch it over the frame; mostly it goes round him. |
| Captain Caffeine | The masterpiece novel on the kitchen table: over two dozen sticky notes, collected over thirty years, and one filled page of a lined notepad | Kevin's front door | None. Kevin holds it at arm's length ("Captain... Caffeine?"), then hands back page one: "Good opening. Here... you keep this one." |
| First-Page Proof | Page one, from Kevin | His former students, outside the corner store | **PROTECT THE TEXT!**: a gust takes the page; he lunges and faceplants; Mina catches it and reads it. "You wrote this?" Then Kevin texts a favour. |

Each ends with the commemorative photo card.

## Kevin's favours

After Captain Caffeine, Kevin keeps sending Bill on pointless errands. He doesn't need them done; he just wants Bill away from his door. Bill takes every one seriously, because every favour means Kevin owes him more, and Kevin is in media, so fame is imminent. The objective card and the arrow follow the current favour; E at Kevin's door reports back and gets the next one. The list loops forever (`src/content/favours.ts`):

- Watch for his delivery van, from your own stoop. You have to stand there.
- Count the parked cars.
- Ask the Lug Nutz what time it is. It's leg day.
- See if the corner store has left-handed scissors.
- Guard his recycling bin.
- Ask Big Wanda what she wants for a bent spoon. She wants the satchel.
- Water his plant. It's plastic.
- Stand at the end of the lane for a bit.
- Stand well back while he checks how far his gate opens. (He slips inside and locks it.)
- Watch his window for a sign that isn't there.
- Find the quietest bit of the parking lot.
- See if there's a queue at the corner store. There is no public.
- Check whether it's cloudy at the other end of the lane.
- Try the bell on Wanda's fence. It isn't attached to anything.
- Make sure the parking lot's lines are still there.
- Practise leaving after ringing his doorbell.

Every third report, Kevin very nearly admits what the favours are for ("I just need you out of... outside. More exterior work."), and Bill misses it ("The project expands.").

At three favours owed there's a photo card: "Fame: imminent."

## Big Wanda's gate

Her gate on the lane is padlocked ("CLOSED. wanda is at lunch. a long lunch.") until the cable and stump errands are done. Then it swings open: "Somewhere down the lane, a junkyard gate creaks open."
