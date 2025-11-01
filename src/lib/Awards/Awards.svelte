<script>
	import { gotoManager } from '$lib/utils/helper';
	import { getAvatarFromTeamManagers, getNestedTeamNamesFromTeamManagers } from '$lib/utils/helperFunctions/universalFunctions';
	export let podium, leagueTeamManagers;

	// League history — The League Champions
	const pastChampions = [
		{ year: 2019, name: "🏆 Emad" },
		{ year: 2020, name: "🏆 Zak" },
		{ year: 2021, name: "💥 League Explosion" },
		{ year: 2022, name: "🏆 Abe H" },
		{ year: 2023, name: "🏆 Amir" },
		{ year: 2024, name: "🏆 MOE G" },
	];

	const { year, champion, second, third, divisions, toilet } = podium;
</script>

<style>
	* { color: var(--g555); }
	h3 { margin: 2.5em 0 1.5em; text-align: center; }

	.awards { display: block; position: relative; width: 100%; z-index: 1; }
	#podium { width: 600px; height: 500px; position: relative; margin: 10px auto 30px; }

	.podiumImage { position: absolute; bottom: 0; left: 0; width: 100%; height: auto; z-index: 3; }
	.champ { position: absolute; width: 20%; transform: translate(-50%, -50%); border-radius: 100%; border: 1px solid var(--bbb); background-color: var(--fff); }
	.laurel { position: absolute; width: 33%; bottom: 56.6%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }

	.first { bottom: 70%; left: 50%; }
	.second { bottom: 43%; left: 20%; }
	.third { bottom: 39%; left: 80%; }

	.trophy { position: absolute; z-index: 4; font-size: 28px; transform: translate(-50%, -50%); pointer-events: none; }
	.firstTrophy { bottom: 76%; left: 58%; }
	.secondTrophy { bottom: 49%; left: 26%; }
	.thirdTrophy { bottom: 45%; left: 86%; }

	.label { white-space: nowrap; line-height: 1.1em; text-align: center; position: absolute; transform: translate(-50%, -50%);
		padding: 6px 30px; background-color: var(--fff); border: 1px solid var(--bbb);
		box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
	}
	.firstLabel { bottom: 60%; left: 50%; color: gold; text-shadow: 0 0 10px gold, 0 0 20px orange; }
	.secondLabel { bottom: 40%; left: 20%; }
	.thirdLabel { bottom: 36%; left: 80%; }

	.banner { display: block; width: 65%; max-width: 450px; margin: 20px auto 0; }
	.toilet-banner { display: block; width: 50%; max-width: 350px; margin: 20px auto 0; }

	.division, .toiletParent { text-align: center; }
	.toiletParent { width: 100%; text-align: center; padding: 25px 0 40px; margin-top: 30px; box-shadow: 0 12px 9px -12px rgba(0,0,0,0.4); }
</style>

<div class="awards">
	<h3>{year} Awards</h3>

	<img src="/banner.png" class="banner" alt="The Champion's Cup" />

	<div id="podium">
		<img src="/podium.png" class="podiumImage" alt="podium" />

		<!-- Champion -->
		<img src="{getAvatarFromTeamManagers(leagueTeamManagers, champion, year)}" class="first champ clickable"
			onclick={() => gotoManager({year, leagueTeamManagers, rosterID: champion})} alt="champion" />
		<span class="trophy firstTrophy">🏆</span>
		<img src="/laurel.png" class="laurel" alt="laurel" />
		<span class="label firstLabel clickable" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: champion})}>
			{@html getNestedTeamNamesFromTeamManagers(leagueTeamManagers, year, champion)}
		</span>

		<!-- Second -->
		<img src="{getAvatarFromTeamManagers(leagueTeamManagers, second, year)}" class="second champ clickable"
			onclick={() => gotoManager({year, leagueTeamManagers, rosterID: second})} alt="2nd" />
		<span class="trophy secondTrophy">🥈</span>
		<span class="label secondLabel clickable" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: second})}>
			{@html getNestedTeamNamesFromTeamManagers(leagueTeamManagers, year, second)}
		</span>

		<!-- Third -->
		<img src="{getAvatarFromTeamManagers(leagueTeamManagers, third, year)}" class="third champ clickable"
			onclick={() => gotoManager({year, leagueTeamManagers, rosterID: third})} alt="3rd" />
		<span class="trophy thirdTrophy">🥉</span>
		<span class="label thirdLabel clickable" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: third})}>
			{@html getNestedTeamNamesFromTeamManagers(leagueTeamManagers, year, third)}
		</span>
	</div>

	<!-- Toilet Bowl -->
	{#if toilet}
	<div class="toiletParent">
		<img src="/toilet-banner.png" class="toilet-banner" alt="The Toilet Bowl" />
		<div class="toiletBowl">
			<img src="{getAvatarFromTeamManagers(leagueTeamManagers, toilet, year)}" class="toiletWinner clickable"
				onclick={() => gotoManager({year, leagueTeamManagers, rosterID: toilet})} alt="toilet bowl winner" />
			<img src="/toilet-bowl-2.png" class="toilet" alt="toilet bowl" />
		</div>
		<span class="genLabel clickable" onclick={() => gotoManager({year, leagueTeamManagers, rosterID: toilet})}>
			{@html getNestedTeamNamesFromTeamManagers(leagueTeamManagers, year, toilet)}
		</span>
	</div>
	{/if}

	<!-- Past Champions List -->
	<h3>Past Champions</h3>
	<ul style="text-align:center; list-style:none; padding:0;">
		{#each pastChampions as champ}
			<li style="margin: 6px 0;">{champ.year}: {champ.name}</li>
		{/each}
	</ul>
</div>