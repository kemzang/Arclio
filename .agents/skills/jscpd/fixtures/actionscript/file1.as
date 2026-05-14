package {
    import flash.display.Sprite;
    import flash.events.Event;

    public class Player extends Sprite {
        private var _name:String;
        private var _score:int;
        private var _level:int;

        public function Player(name:String) {
            _name = name;
            _score = 0;
            _level = 1;
        }

        public function get name():String {
            return _name;
        }

        public function addScore(points:int):void {
            _score += points;
            trace("Score updated: " + _score);
            if (_score >= _level * 100) {
                levelUp();
            }
        }

        public function get score():int {
            return _score;
        }

        private function levelUp():void {
            _level++;
            trace("Level up! Now at level: " + _level);
        }
    }
}
