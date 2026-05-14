// Unreal Engine 3 UnrealScript - Character Controller
class MyCharacter extends GamePawn
  placeable;

var float WalkSpeed;
var float RunSpeed;
var float JumpHeight;
var bool bIsRunning;
var bool bIsCrouching;

var SoundCue FootstepSound;
var SoundCue JumpSound;
var SoundCue LandSound;

var ParticleSystemComponent DustEffect;

simulated event PostBeginPlay()
{
  Super.PostBeginPlay();
  WalkSpeed  = 300.0f;
  RunSpeed   = 600.0f;
  JumpHeight = 420.0f;
  bIsRunning   = false;
  bIsCrouching = false;
  GroundSpeed  = WalkSpeed;
}

simulated function SetRunning(bool bRun)
{
  bIsRunning = bRun;
  if (bIsRunning)
  {
    GroundSpeed = RunSpeed;
  }
  else
  {
    GroundSpeed = WalkSpeed;
  }
}

simulated function SetCrouching(bool bCrouch)
{
  bIsCrouching = bCrouch;
  if (bIsCrouching)
  {
    GroundSpeed = WalkSpeed * 0.5f;
    ShouldCrouch(true);
  }
  else
  {
    GroundSpeed = bIsRunning ? RunSpeed : WalkSpeed;
    ShouldCrouch(false);
  }
}

event TakeDamage(
  int Damage, Controller EventInstigator,
  vector HitLocation, vector Momentum,
  class<DamageType> DamageType,
  optional TraceHitInfo HitInfo,
  optional Actor DamageCauser)
{
  Super.TakeDamage(Damage, EventInstigator, HitLocation, Momentum, DamageType, HitInfo, DamageCauser);
  if (Health <= 0)
  {
    PlayDying(DamageType, HitLocation);
  }
}

defaultproperties
{
  WalkSpeed  = 300.0
  RunSpeed   = 600.0
  JumpHeight = 420.0
  bCanCrouch = true
  bCanJump   = true
}
