import { getDistanceBetweenTwoPoints } from "../utils/geometry/getDistanceBetweenTwoPoints.js";
import { getTwoCirclesIntersectionInfo } from "../utils/geometry/getTwoCirclesIntersectionInfo.js";
import { getMidpoint } from "../utils/geometry/getMidpoint.js";
import { getPointOnLineWithDistanceDirection } from "../utils/geometry/getPointOnLineWithDistanceDirection.js";
// While intersections still exist:
//   1. for each marker m1 that is not in a group:
//      1. find any markers m2 that are not in a group and m1 != m2, combine them into merged marker (add radius, find midpoint of i and marker)
//      2. mark intersecting markers as "merged" already (they should not be considered anymore)
//      3. don't mark i as merged (merged marker might end up intersecting with it in future)
export function markerMergeV8(markers) {
    const markerKeys = Object.keys(markers);
    let intersectionsStillExist = true; 
    while (intersectionsStillExist) {
        intersectionsStillExist = false;
        for (let i of markerKeys) {
            if (markers[i].inGroup || markers[i].static) {
                continue;
            }
            for (let j of markerKeys) {
                // const c1 = markers[i];
                // const c2 = markers[j];
                
                // if they are the same or already in the same group, don't compare it
                if (markers[i].id === markers[j].id || markers[j].inGroup || markers[j].static) {
                    continue;
                }
                // somehow stuff is making it here when inGroup is true, figure out why later
                if (markers[i].inGroup || markers[j].inGroup) {
                    // console.log(JSON.parse(JSON.stringify(markers[i])), JSON.parse(JSON.stringify(markers[j])));
                    continue;
                }
                // logic for computing intersection
                const distance = getDistanceBetweenTwoPoints(markers[i].coords, markers[j].coords);
                const r1 = markers[i].radius;
                const r2 = markers[j].radius;
                const intersectionInfo = getTwoCirclesIntersectionInfo(r1, r2, distance);
                // console.log(intersectionInfo);
                if (intersectionInfo.intersectsWithoutTouching) {
                    intersectionsStillExist = true;
                    // decide rules for the new marker groups size and position
                    let winner;
                    let loser;
                    if (r1 >= r2) {
                        winner = markers[i];
                        loser = markers[j];
                        // console.log(winner === markers[i], loser === markers[j]);
                    } else {
                        winner = markers[j];
                        loser = markers[i];
                        // console.log(winner === markers[j], loser === markers[i]);
                    }

                    winner.members = winner.members.concat(loser.members);
                    winner.people = winner.people.concat(loser.people);
                    loser.inGroup = true;
                    // if (loser.id === "group-3") {
                        
                    //     console.log(JSON.parse(JSON.stringify(winner)), JSON.parse(JSON.stringify(loser)));
                    //     console.log("1")
                    // }
                    

                    // loser.members = [];
                    
                    
                    if (!(intersectionInfo.c1ContainsC2 || intersectionInfo.c2ContainsC1)) {
                        const midpoint = getMidpoint(winner.coords, loser.coords);
                        const distanceToMidpoint = getDistanceBetweenTwoPoints(winner.coords, midpoint);
                        const distanceToMoveMergedMarker = distanceToMidpoint * (loser.radius / winner.radius);
                        winner.coords = getPointOnLineWithDistanceDirection(winner.coords, loser.coords, distanceToMoveMergedMarker);
                        winner.radius += 1;
                    } 
                }  
            }
        }
    }

    return markers;
}